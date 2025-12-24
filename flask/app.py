from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
import json
from datetime import datetime
import re
import spacy
import numpy as np
from collections import Counter
from sklearn.linear_model import LinearRegression
from sklearn.feature_extraction.text import TfidfVectorizer

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"], supports_credentials=True, 
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"])

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

# Load spaCy French model for real NLP
try: 
    nlp = spacy.load("fr_core_news_md")
    logger.info("spaCy French model loaded successfully")
except: 
    logger.warning("French spaCy model not found.  Install with: python -m spacy download fr_core_news_md")
    nlp = None


class TextAnalyzer:
    """
    Real NLP text analysis using spaCy
    Provides:  tokenization, NER, POS tagging, dependency parsing, similarity
    """
    
    def __init__(self):
        self.nlp = nlp
        # French risk/priority keywords
        self.risk_keywords = {
            'high': ['urgent', 'critique', 'obligatoire', 'immédiat', 'sanction', 
                    'amende', 'danger', 'risque', 'violation', 'non-conformité',
                    'impératif', 'essentiel', 'prioritaire', 'grave', 'sévère'],
            'medium':  ['important', 'nécessaire', 'recommandé', 'attention', 
                      'surveiller', 'améliorer', 'corriger', 'modifier', 'adapter'],
            'low':  ['optionnel', 'suggéré', 'envisager', 'considérer', 'possible',
                   'éventuel', 'mineur', 'secondaire']
        }
        
        # Domain-specific vocabulary
        self.domain_keywords = {
            'environnement': ['déchet', 'pollution', 'émission', 'recyclage', 'énergie', 
                             'carbone', 'environnemental', 'écologique', 'durable'],
            'sécurité': ['accident', 'protection', 'équipement', 'formation', 'risque',
                        'prévention', 'sécurité', 'danger', 'incident'],
            'qualité': ['norme', 'certification', 'processus', 'contrôle', 'audit',
                       'conformité', 'qualité', 'amélioration', 'standard'],
            'rh': ['employé', 'formation', 'compétence', 'recrutement', 'personnel',
                  'ressources humaines', 'contrat', 'salaire'],
            'finance': ['budget', 'coût', 'investissement', 'comptable', 'financier',
                       'audit', 'fiscal', 'trésorerie']
        }
    
    def analyze_text(self, text):
        """
        Comprehensive NLP analysis of text
        Returns entities, keywords, sentiment, complexity, and more
        """
        if not self.nlp or not text:
            return self._get_empty_analysis()
        
        try:
            doc = self.nlp(text)
            
            # 1. Named Entity Recognition
            entities = self._extract_entities(doc)
            
            # 2. Part-of-Speech analysis - extract key terms
            key_terms = self._extract_key_terms(doc)
            
            # 3. Noun phrase extraction (topics)
            topics = self._extract_topics(doc)
            
            # 4. Action verb extraction
            actions = self._extract_actions(doc)
            
            # 5. Risk/Priority detection
            risk_analysis = self._analyze_risk_level(doc)
            
            # 6. Domain detection
            detected_domain = self._detect_domain(doc)
            
            # 7. Text complexity analysis
            complexity = self._analyze_complexity(doc, text)
            
            # 8. Sentiment analysis (simple rule-based for French)
            sentiment = self._analyze_sentiment_simple(doc)
            
            # 9. Dependency parsing for relationships
            relationships = self._extract_relationships(doc)
            
            return {
                'entities': entities,
                'key_terms': key_terms,
                'topics': topics,
                'actions': actions,
                'risk_analysis': risk_analysis,
                'detected_domain': detected_domain,
                'complexity': complexity,
                'sentiment':  sentiment,
                'relationships': relationships,
                'word_count': len([t for t in doc if not t.is_punct]),
                'sentence_count': len(list(doc.sents))
            }
        except Exception as e: 
            logger.error(f"Error in analyze_text: {str(e)}")
            return self._get_empty_analysis()
    
    def _extract_entities(self, doc):
        """Extract named entities with categories"""
        entities = {
            'organizations': [],
            'persons': [],
            'locations': [],
            'dates': [],
            'regulations': [],
            'other': []
        }
        
        for ent in doc. ents:
            if ent.label_ in ['ORG']: 
                entities['organizations'].append(ent.text)
            elif ent.label_ in ['PER']: 
                entities['persons'].append(ent.text)
            elif ent.label_ in ['LOC', 'GPE']: 
                entities['locations'].append(ent.text)
            elif ent.label_ in ['DATE', 'TIME']:
                entities['dates'].append(ent.text)
            else:
                entities['other'].append({'text': ent.text, 'type': ent.label_})
        
        # Look for regulation patterns (ISO, NF, etc.)
        regulation_patterns = re.findall(r'(ISO\s*\d+|NF\s*[A-Z]*\s*\d+|RGPD|GDPR|SOX)', doc.text, re.IGNORECASE)
        entities['regulations'] = list(set(regulation_patterns))
        
        return entities
    
    def _extract_key_terms(self, doc):
        """Extract important terms using POS tagging"""
        key_terms = []
        
        for token in doc: 
            # Skip stopwords and punctuation
            if token.is_stop or token. is_punct or token.is_space:
                continue
            
            # Extract nouns, verbs, adjectives
            if token. pos_ in ['NOUN', 'VERB', 'ADJ', 'PROPN']:
                key_terms.append({
                    'text': token.text,
                    'lemma': token.lemma_,
                    'pos': token.pos_,
                    'importance': self._calculate_term_importance(token)
                })
        
        # Sort by importance and return top terms
        key_terms.sort(key=lambda x: x['importance'], reverse=True)
        return key_terms[: 15]
    
    def _calculate_term_importance(self, token):
        """Calculate importance score for a term"""
        score = 1.0
        
        # Proper nouns are important
        if token. pos_ == 'PROPN':
            score += 0.5
        
        # Root of sentence is important
        if token.dep_ == 'ROOT':
            score += 0.3
        
        # Subject/object are important
        if token.dep_ in ['nsubj', 'dobj', 'pobj']:
            score += 0.2
        
        # Check if it's a risk keyword
        lemma_lower = token.lemma_.lower()
        for level, keywords in self.risk_keywords.items():
            if lemma_lower in keywords: 
                score += 0.5 if level == 'high' else 0.3 if level == 'medium' else 0.1
        
        return score
    
    def _extract_topics(self, doc):
        """Extract main topics using noun chunks"""
        topics = []
        
        for chunk in doc.noun_chunks:
            # Filter out very short or stopword-only chunks
            meaningful_tokens = [t for t in chunk if not t.is_stop and not t.is_punct]
            if meaningful_tokens: 
                topics.append({
                    'text': chunk.text,
                    'root': chunk.root. text,
                    'root_lemma': chunk.root.lemma_
                })
        
        return topics[: 10]
    
    def _extract_actions(self, doc):
        """Extract action verbs with their objects"""
        actions = []
        
        for token in doc: 
            if token. pos_ == 'VERB' and not token.is_stop:
                # Find the object of this verb
                objects = [child. text for child in token.children if child.dep_ in ['dobj', 'pobj', 'obj']]
                
                actions.append({
                    'verb': token.text,
                    'lemma': token.lemma_,
                    'objects': objects,
                    'is_root': token.dep_ == 'ROOT'
                })
        
        return actions
    
    def _analyze_risk_level(self, doc):
        """Analyze risk level based on vocabulary"""
        risk_scores = {'high': 0, 'medium': 0, 'low': 0}
        matched_keywords = {'high': [], 'medium': [], 'low': []}
        
        for token in doc: 
            lemma_lower = token.lemma_.lower()
            for level, keywords in self.risk_keywords. items():
                if lemma_lower in keywords:
                    risk_scores[level] += 1
                    matched_keywords[level].append(token.text)
        
        # Determine overall risk level
        if risk_scores['high'] >= 2 or (risk_scores['high'] >= 1 and risk_scores['medium'] >= 2):
            overall_risk = 'Élevée'
        elif risk_scores['high'] >= 1 or risk_scores['medium'] >= 2:
            overall_risk = 'Moyenne'
        else: 
            overall_risk = 'Faible'
        
        return {
            'level': overall_risk,
            'scores':  risk_scores,
            'matched_keywords': matched_keywords,
            'confidence':  min(sum(risk_scores. values()) / 5, 1.0)
        }
    
    def _detect_domain(self, doc):
        """Detect the domain/category of the text"""
        domain_scores = {domain: 0 for domain in self.domain_keywords. keys()}
        
        for token in doc:
            lemma_lower = token. lemma_.lower()
            for domain, keywords in self.domain_keywords.items():
                if lemma_lower in keywords or any(kw in token.text.lower() for kw in keywords):
                    domain_scores[domain] += 1
        
        # Get the domain with highest score
        if max(domain_scores. values()) > 0:
            detected = max(domain_scores, key=domain_scores.get)
            confidence = domain_scores[detected] / max(sum(domain_scores. values()), 1)
        else:
            detected = 'général'
            confidence = 0.5
        
        return {
            'domain': detected,
            'confidence': confidence,
            'all_scores': domain_scores
        }
    
    def _analyze_complexity(self, doc, text):
        """Analyze text complexity"""
        sentences = list(doc. sents)
        words = [t for t in doc if not t.is_punct and not t.is_space]
        
        if not words: 
            return {'level': 'Faible', 'score': 0.0, 'metrics': {}}
        
        # Average sentence length
        avg_sentence_length = len(words) / max(len(sentences), 1)
        
        # Average word length
        avg_word_length = sum(len(t.text) for t in words) / max(len(words), 1)
        
        # Vocabulary richness (unique lemmas / total words)
        lemmas = set(t. lemma_. lower() for t in words if not t.is_stop)
        vocab_richness = len(lemmas) / max(len(words), 1)
        
        # Technical term density
        technical_terms = [t for t in words if len(t.text) > 8 or t.pos_ == 'PROPN']
        tech_density = len(technical_terms) / max(len(words), 1)
        
        # Determine complexity level
        complexity_score = (
            (avg_sentence_length / 20) * 0.3 +
            (avg_word_length / 8) * 0.2 +
            vocab_richness * 0.3 +
            tech_density * 0.2
        )
        
        if complexity_score > 0.6:
            level = 'Élevée'
        elif complexity_score > 0.4:
            level = 'Moyenne'
        else: 
            level = 'Faible'
        
        return {
            'level':  level,
            'score': round(complexity_score, 2),
            'metrics': {
                'avg_sentence_length': round(avg_sentence_length, 1),
                'avg_word_length':  round(avg_word_length, 1),
                'vocabulary_richness': round(vocab_richness, 2),
                'technical_density': round(tech_density, 2)
            }
        }
    
    def _analyze_sentiment_simple(self, doc):
        """Simple rule-based sentiment analysis for French"""
        positive_words = ['bon', 'bien', 'excellent', 'positif', 'succès', 'réussi', 'efficace', 'optimal', 'amélioration']
        negative_words = ['mauvais', 'mal', 'échec', 'problème', 'risque', 'danger', 'critique', 'urgent', 'retard', 'insuffisant']
        
        pos_count = 0
        neg_count = 0
        
        for token in doc:
            lemma = token.lemma_. lower()
            if lemma in positive_words:
                pos_count += 1
            elif lemma in negative_words: 
                neg_count += 1
        
        total = pos_count + neg_count
        if total == 0:
            polarity = 0
        else:
            polarity = (pos_count - neg_count) / total
        
        if polarity > 0.1:
            label = 'positif'
        elif polarity < -0.1:
            label = 'négatif'
        else:
            label = 'neutre'
        
        return {
            'label': label,
            'polarity':  round(polarity, 2),
            'positive_count': pos_count,
            'negative_count': neg_count
        }
    
    def _extract_relationships(self, doc):
        """Extract subject-verb-object relationships"""
        relationships = []
        
        for sent in doc.sents:
            for token in sent:
                if token.pos_ == 'VERB': 
                    # Find subject
                    subjects = [child.text for child in token. children if child.dep_ in ['nsubj', 'nsubjpass']]
                    # Find objects
                    objects = [child.text for child in token.children if child.dep_ in ['dobj', 'pobj', 'obj', 'obl']]
                    
                    if subjects or objects:
                        relationships.append({
                            'verb': token.lemma_,
                            'subjects': subjects,
                            'objects': objects
                        })
        
        return relationships[: 5]
    
    def _get_empty_analysis(self):
        """Return empty analysis structure"""
        return {
            'entities':  {'organizations': [], 'persons': [], 'locations': [], 'dates': [], 'regulations': [], 'other': []},
            'key_terms':  [],
            'topics':  [],
            'actions': [],
            'risk_analysis': {'level': 'Moyenne', 'scores':  {}, 'matched_keywords': {}, 'confidence': 0},
            'detected_domain': {'domain': 'général', 'confidence':  0},
            'complexity':  {'level': 'Moyenne', 'score':  0.5, 'metrics':  {}},
            'sentiment': {'label':  'neutre', 'polarity':  0, 'positive_count': 0, 'negative_count': 0},
            'relationships': [],
            'word_count': 0,
            'sentence_count': 0
        }
    
    def calculate_text_similarity(self, text1, text2):
        """Calculate semantic similarity between two texts"""
        if not self.nlp:
            return 0.5
        
        try:
            doc1 = self. nlp(text1)
            doc2 = self.nlp(text2)
            return doc1.similarity(doc2)
        except Exception as e:
            logger.error(f"Error calculating similarity: {str(e)}")
            return 0.5
    
    def extract_keywords_tfidf(self, texts):
        """Extract keywords using TF-IDF across multiple texts"""
        if not texts:
            return []
        
        try:
            vectorizer = TfidfVectorizer(
                max_features=20,
                stop_words=None,
                ngram_range=(1, 2)
            )
            
            tfidf_matrix = vectorizer.fit_transform(texts)
            feature_names = vectorizer.get_feature_names_out()
            
            # Get average TF-IDF scores
            avg_scores = np.mean(tfidf_matrix.toarray(), axis=0)
            
            # Sort by score
            sorted_indices = avg_scores.argsort()[::-1]
            
            keywords = []
            for idx in sorted_indices[: 10]: 
                keywords.append({
                    'term': feature_names[idx],
                    'score': round(float(avg_scores[idx]), 4)
                })
            
            return keywords
        except Exception as e:
            logger.warning(f"TF-IDF extraction failed: {e}")
            return []


# Initialize text analyzer
text_analyzer = TextAnalyzer()


class NLPService: 
    def __init__(self):
        # FIXED: Use the correct model name from your original code
        self.model = genai.GenerativeModel('gemini-flash-latest')
        self.text_analyzer = text_analyzer
        
    def analyze_action_description(self, description, domain=None, theme=None):
        """Analyze action plan description using real NLP + Gemini"""
        try:
            # STEP 1: Real NLP Analysis using spaCy
            nlp_analysis = self.text_analyzer.analyze_text(description)
            
            # STEP 2: Use NLP insights to enhance Gemini prompt
            enhanced_prompt = self._create_enhanced_prompt(description, domain, theme, nlp_analysis)
            
            # STEP 3: Generate response using Gemini with NLP context
            response = self.model.generate_content(enhanced_prompt)
            
            # STEP 4: Parse and merge responses
            gemini_response = self._parse_gemini_response(response. text)
            
            # STEP 5: Merge NLP analysis with Gemini response
            final_response = self._merge_nlp_and_gemini(nlp_analysis, gemini_response)
            
            return final_response
            
        except Exception as e: 
            logger.error(f"Error analyzing action description: {str(e)}")
            return self._get_fallback_response(description)
    
    def _create_enhanced_prompt(self, description, domain, theme, nlp_analysis):
        """Create an enhanced prompt using NLP insights"""
        
        # Extract NLP insights for the prompt
        risk_level = nlp_analysis['risk_analysis']['level']
        detected_domain = nlp_analysis['detected_domain']['domain']
        key_terms = [t['lemma'] for t in nlp_analysis['key_terms'][:5]]
        entities = nlp_analysis['entities']
        complexity = nlp_analysis['complexity']['level']
        
        base_prompt = f"""
        Vous êtes un consultant expert en audit spécialisé dans la conformité et la gestion des risques. 
        
        === ANALYSE NLP PRÉLIMINAIRE ===
        - Niveau de risque détecté: {risk_level}
        - Domaine identifié: {detected_domain}
        - Termes clés extraits: {', '.join(key_terms)}
        - Complexité du texte: {complexity}
        - Organisations mentionnées: {', '.join(entities['organizations']) if entities['organizations'] else 'Aucune'}
        - Réglementations détectées: {', '.join(entities['regulations']) if entities['regulations'] else 'Aucune'}
        
        === DESCRIPTION DE L'ACTION ===
        "{description}"
        """
        
        if domain:
            base_prompt += f"\nDomaine spécifié: {domain}"
        if theme:
            base_prompt += f"\nThème spécifié: {theme}"
            
        base_prompt += """
        
        En tenant compte de l'analyse NLP ci-dessus, fournissez une réponse JSON avec la structure suivante EN FRANÇAIS:
        {
            "priority_level": "Élevée/Moyenne/Faible",
            "risk_assessment": "Analyse des risques basée sur les termes détectés",
            "recommended_tips": [
                "Conseil 1: Conseil actionnable spécifique",
                "Conseil 2: Autre recommandation pratique",
                "Conseil 3: Guidance supplémentaire"
            ],
            "compliance_areas": ["domaine1", "domaine2"],
            "estimated_effort": "Faible/Moyen/Élevé",
            "suggested_timeline": "Délai recommandé",
            "key_stakeholders": ["rôle1", "rôle2"],
            "success_metrics": ["métrique1", "métrique2"]
        }
        
        IMPORTANT: Répondez UNIQUEMENT avec du JSON valide. 
        """
        
        return base_prompt
    
    def _merge_nlp_and_gemini(self, nlp_analysis, gemini_response):
        """Merge NLP analysis with Gemini response for comprehensive output"""
        
        # Use NLP-detected risk if Gemini's assessment differs significantly
        nlp_risk = nlp_analysis['risk_analysis']['level']
        
        # Add NLP-specific insights
        gemini_response['nlp_insights'] = {
            'detected_entities': nlp_analysis['entities'],
            'key_terms':  [t['lemma'] for t in nlp_analysis['key_terms'][:10]],
            'detected_domain': nlp_analysis['detected_domain'],
            'text_complexity': nlp_analysis['complexity'],
            'sentiment':  nlp_analysis['sentiment'],
            'action_verbs': [a['lemma'] for a in nlp_analysis['actions'][:5]],
            'main_topics': [t['text'] for t in nlp_analysis['topics'][:5]],
            'risk_keywords_found': nlp_analysis['risk_analysis']['matched_keywords']
        }
        
        # Override priority if NLP strongly disagrees
        if nlp_analysis['risk_analysis']['confidence'] > 0.7:
            gemini_response['nlp_priority_level'] = nlp_risk
            gemini_response['priority_confidence'] = nlp_analysis['risk_analysis']['confidence']
        
        return gemini_response
    
    def generate_taxonomy_suggestion(self, existing_domains=None):
        """Generate a new taxonomy suggestion"""
        try:
            prompt = self._create_taxonomy_prompt(existing_domains)
            response = self.model.generate_content(prompt)
            return self._parse_taxonomy_response(response. text)
            
        except Exception as e:
            logger.error(f"Error generating taxonomy suggestion:  {str(e)}")
            return self._get_fallback_taxonomy_response()
    
    def _create_taxonomy_prompt(self, existing_domains=None):
        """Create a detailed prompt for taxonomy generation in French"""
        base_prompt = """
        Vous êtes un expert en taxonomie d'audit et de conformité.
        
        Générez une suggestion de taxonomie pour un système d'audit qui comprend:
        - 1 domaine principal
        - 1 ou 2 thèmes pour ce domaine
        - 1 ou 2 sous-thèmes pour chaque thème
        
        Les domaines couramment utilisés incluent:  Santé et sécurité au travail, Environnement, Qualité, Sécurité informatique, Ressources humaines, Finance, Gouvernance, etc.
        """
        
        if existing_domains: 
            base_prompt += f"\nDomaines existants à éviter: {', '. join(existing_domains)}\n"
        
        base_prompt += """
        Format de réponse JSON requis:
        {
            "domain":  {
                "name":  "Nom du domaine concis et professionnel",
                "themes": [
                    {
                        "name": "Nom du thème 1",
                        "subthemes": ["Sous-thème 1.1", "Sous-thème 1.2"]
                    }
                ]
            }
        }
        
        IMPORTANT: Répondez UNIQUEMENT avec du JSON valide, tout en français.
        """
        
        return base_prompt
    
    def _parse_taxonomy_response(self, response_text):
        """Parse and validate taxonomy response"""
        try:
            response_text = response_text. strip()
            
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            response_text = response_text. strip()
            
            json_start = response_text. find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                parsed_response = json.loads(json_str)
                return self._validate_taxonomy_response(parsed_response)
            else: 
                return self._get_fallback_taxonomy_response()
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error:  {str(e)}")
            return self._get_fallback_taxonomy_response()
    
    def _validate_taxonomy_response(self, response):
        """Validate and ensure all required fields are present"""
        try:
            domain = response. get('domain', {})
            domain_name = domain. get('name', 'Nouveau Domaine')
            themes = domain.get('themes', [])
            
            if not themes:
                themes = [{'name':  'Thème Principal', 'subthemes': ['Sous-thème 1', 'Sous-thème 2']}]
            
            validated_themes = []
            for theme in themes[: 2]: 
                theme_name = theme. get('name', 'Thème')
                subthemes = theme.get('subthemes', ['Sous-thème principal'])
                validated_themes.append({'name': theme_name, 'subthemes': subthemes[: 2]})
            
            return {'domain': {'name': domain_name, 'themes':  validated_themes}}
            
        except Exception as e:
            logger.error(f"Error validating taxonomy response:  {str(e)}")
            return self._get_fallback_taxonomy_response()
    
    def _get_fallback_taxonomy_response(self):
        """Get fallback taxonomy response"""
        return {
            'domain': {
                'name':  'Sécurité Informatique',
                'themes': [
                    {'name': 'Protection des données', 'subthemes': ['Chiffrement et sécurisation', 'Sauvegarde et archivage']},
                    {'name':  'Contrôle d\'accès', 'subthemes': ['Authentification et autorisation']}
                ]
            }
        }
    
    def _parse_gemini_response(self, response_text):
        """Parse and validate Gemini response"""
        try: 
            response_text = response_text.strip()
            
            if response_text. startswith('```json'):
                response_text = response_text[7:]
            if response_text. startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                parsed_response = json.loads(json_str)
                return self._validate_response(parsed_response)
            else: 
                return self._create_fallback_response(response_text)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error:  {str(e)}")
            return self._create_fallback_response(response_text)
    
    def _validate_response(self, response):
        """Validate and ensure all required fields are present"""
        validated = {}
        
        priority = response.get('priority_level', 'Moyenne')
        french_priorities = ['Élevée', 'Moyenne', 'Faible', 'Haute', 'Basse']
        validated['priority_level'] = priority if priority in french_priorities else 'Moyenne'
        
        validated['risk_assessment'] = response.get('risk_assessment', 'Évaluation des risques de conformité standard requise')
        
        tips = response.get('recommended_tips', [])
        if not isinstance(tips, list) or len(tips) == 0:
            tips = [
                "Examinez attentivement les exigences de l'action",
                "Consultez les parties prenantes pertinentes dès le début",
                "Documentez régulièrement les progrès"
            ]
        validated['recommended_tips'] = tips[: 5]
        
        areas = response.get('compliance_areas', ['Conformité Générale'])
        validated['compliance_areas'] = areas if isinstance(areas, list) and len(areas) > 0 else ['Conformité Générale']
        
        effort = response.get('estimated_effort', 'Moyen')
        french_efforts = ['Faible', 'Moyen', 'Élevé', 'Bas', 'Haut']
        validated['estimated_effort'] = effort if effort in french_efforts else 'Moyen'
        
        validated['suggested_timeline'] = response.get('suggested_timeline', '2-4 semaines')
        
        stakeholders = response.get('key_stakeholders', ['Responsable de l\'Action', 'Équipe de Conformité'])
        validated['key_stakeholders'] = stakeholders if isinstance(stakeholders, list) and len(stakeholders) > 0 else ['Responsable de l\'Action']
        
        metrics = response.get('success_metrics', ['Réalisation dans les délais', 'Qualité de la mise en œuvre'])
        validated['success_metrics'] = metrics if isinstance(metrics, list) and len(metrics) > 0 else ['Réalisation dans les délais']
        
        return validated
    
    def _create_fallback_response(self, text):
        """Create structured response from unstructured text"""
        return {
            'priority_level': 'Moyenne',
            'risk_assessment':  'Analyse terminée - veuillez examiner les exigences de l\'action',
            'recommended_tips': [
                'Examinez attentivement les exigences de l\'action',
                'Impliquez les parties prenantes pertinentes dès le début',
                'Surveillez régulièrement les progrès et documentez les résultats',
                'Assurez-vous de la conformité aux réglementations applicables'
            ],
            'compliance_areas': ['Conformité Générale'],
            'estimated_effort': 'Moyen',
            'suggested_timeline': '2-4 semaines',
            'key_stakeholders':  ['Responsable de l\'Action', 'Équipe de Conformité'],
            'success_metrics': ['Taux de réalisation', 'Évaluation de la qualité'],
            'detailed_analysis': text[: 200] + '...' if len(text) > 200 else text
        }
    
    def _get_fallback_response(self, description):
        """Get fallback response when service fails"""
        # Still try to do basic NLP analysis even if Gemini fails
        nlp_analysis = self. text_analyzer.analyze_text(description)
        
        response = {
            'priority_level': nlp_analysis['risk_analysis']['level'],
            'risk_assessment': 'Analyse automatique basée sur NLP - révision manuelle recommandée',
            'recommended_tips':  [
                'Examinez attentivement les exigences de l\'action',
                'Identifiez les parties prenantes clés et les dépendances',
                'Créez un plan de mise en œuvre détaillé',
                'Établissez des points de contrôle de progrès réguliers'
            ],
            'compliance_areas': [nlp_analysis['detected_domain']['domain']. capitalize()],
            'estimated_effort': 'Moyen',
            'suggested_timeline': '2-4 semaines',
            'key_stakeholders':  ['Responsable de l\'Action', 'Responsable de la Conformité'],
            'success_metrics': ['Réalisation dans les délais', 'Respect des normes de qualité'],
            'nlp_insights': {
                'detected_entities': nlp_analysis['entities'],
                'key_terms': [t['lemma'] for t in nlp_analysis['key_terms'][:10]],
                'detected_domain': nlp_analysis['detected_domain'],
                'text_complexity':  nlp_analysis['complexity'],
                'sentiment':  nlp_analysis['sentiment']
            }
        }
        
        return response

    def analyze_subscription_patterns(self, statistics, plans):
        """
        Use NLP + statistical analysis to analyze subscription patterns
        """
        try:
            total_companies = statistics. get('totalCompanies', 0)
            active_companies = statistics.get('activeCompanies', 0)
            subscription_dist = statistics.get('subscriptionDistribution', [])
            avg_users = statistics.get('avgUsersPerCompany', 0)
            total_actions = statistics.get('totalActions', 0)
            completed_actions = statistics. get('completedActions', 0)
            total_texts = statistics.get('totalTexts', 0)
            compliant_texts = statistics.get('compliantTexts', 0)
            
            action_completion_rate = (completed_actions / max(total_actions, 1)) * 100
            compliance_rate = (compliant_texts / max(total_texts, 1)) * 100
            
            suggestions = []
            
            # Collect all feature texts for TF-IDF analysis
            all_feature_texts = []
            plan_features_map = {}
            
            for plan in plans:
                plan_id = plan.get('planId')
                
                # NLP:  Analyze plan name
                plan_name = plan.get('name', '')
                plan_name_analysis = self.text_analyzer.analyze_text(plan_name) if plan_name else None
                
                # NLP: Analyze features
                try:
                    features_json = plan.get('features', '[]')
                    if isinstance(features_json, str):
                        features = json.loads(features_json)
                    else:
                        features = features_json
                    
                    if isinstance(features, list):
                        feature_text = ' '.join(str(f) for f in features)
                        all_feature_texts.append(feature_text)
                        plan_features_map[plan_id] = feature_text
                except:
                    features = []
                    feature_text = ''
                    plan_features_map[plan_id] = ''
                
                # Find subscription data for this plan
                plan_subs = next((s for s in subscription_dist if s['planId'] == plan_id), None)
                
                if plan_subs:
                    adoption_rate = (plan_subs['count'] / max(active_companies, 1)) * 100
                    avg_plan_users = plan_subs. get('avgUsers', 0)
                    subscriber_count = plan_subs['count']
                    
                    # NLP: Analyze feature descriptions for insights
                    feature_analysis = self.text_analyzer.analyze_text(feature_text) if feature_text else None
                    
                    # Generate insights based on patterns + NLP
                    insight = self._generate_plan_insights_with_nlp(
                        plan, 
                        adoption_rate, 
                        avg_plan_users, 
                        avg_users,
                        subscriber_count,
                        action_completion_rate,
                        compliance_rate,
                        feature_analysis,
                        plan_name_analysis
                    )
                    
                    actionable_updates = self._generate_actionable_updates(plan, insight['suggestedChanges'])
                    
                    suggestions. append({
                        'planId': plan_id,
                        'planName': plan['name'],
                        'currentMetrics': {
                            'adoptionRate': round(adoption_rate, 2),
                            'avgUsers': round(avg_plan_users, 2),
                            'subscribers': subscriber_count
                        },
                        'insights': insight['insights'],
                        'recommendations': insight['recommendations'],
                        'suggestedChanges':  insight['suggestedChanges'],
                        'actionableUpdates': actionable_updates,
                        'priorityScore': insight['priorityScore'],
                        'riskLevel': insight['riskLevel'],
                        'nlpAnalysis': {
                            'featureKeywords': feature_analysis['key_terms'][:5] if feature_analysis else [],
                            'featureComplexity': feature_analysis['complexity'] if feature_analysis else None,
                            'detectedDomain': feature_analysis['detected_domain'] if feature_analysis else None
                        }
                    })
                else:
                    # Plan has no subscribers
                    base_price = plan.get('basePrice', 0)
                    suggested_price = base_price * 0.8
                    suggested_changes = {
                        'prix': "Réduire à {:.2f}$ (test marché)".format(suggested_price),
                        'rabais': "Appliquer 15-20% de réduction temporaire",
                        "Limite d'utilisateur":  'Aligner sur la demande moyenne du marché',
                        'traits': 'Enrichir avec fonctionnalités demandées'
                    }
                    
                    actionable_updates = self._generate_actionable_updates(plan, suggested_changes)
                    
                    suggestions.append({
                        'planId': plan_id,
                        'planName': plan['name'],
                        'currentMetrics': {'adoptionRate': 0, 'avgUsers': 0, 'subscribers': 0},
                        'insights': [
                            "⚠️ Ce plan n'a aucun abonné actuel",
                            "📊 Analyse comparative avec les plans populaires recommandée",
                            "🎯 Positionnement de marché à revoir"
                        ],
                        'recommendations':  [
                            "Réévaluer le positionnement prix/fonctionnalités",
                            "Considérer la désactivation si non stratégique",
                            "Analyser les écarts avec les plans ayant des abonnés",
                            "Envisager une offre promotionnelle limitée"
                        ],
                        'suggestedChanges': suggested_changes,
                        'actionableUpdates': actionable_updates,
                        'priorityScore': 9,
                        'riskLevel': 'high',
                        'nlpAnalysis':  None
                    })
            
            # NLP: Extract common keywords across all plans using TF-IDF
            common_keywords = self. text_analyzer.extract_keywords_tfidf(all_feature_texts) if all_feature_texts else []
            
            # NLP: Calculate feature similarity between plans
            feature_similarities = self._calculate_plan_similarities(plan_features_map)
            
            suggestions.sort(key=lambda x: x['priorityScore'], reverse=True)
            
            market_insights = self._generate_market_insights_with_nlp(
                statistics, 
                subscription_dist, 
                avg_users,
                action_completion_rate,
                compliance_rate,
                common_keywords,
                feature_similarities
            )
            
            return {
                'planSuggestions': suggestions,
                'marketInsights': market_insights,
                'analysisDate': datetime.now().isoformat(),
                'methodology': 'Analyse NLP (spaCy) + TF-IDF + Analyse Statistique',
                'globalMetrics': {
                    'actionCompletionRate':  round(action_completion_rate, 2),
                    'complianceRate': round(compliance_rate, 2),
                    'avgUsersPerCompany':  round(avg_users, 2),
                    'totalActiveCompanies': active_companies
                },
                'nlpMetrics': {
                    'commonKeywords': common_keywords,
                    'planSimilarities': feature_similarities
                }
            }
            
        except Exception as e: 
            logger.error(f"Error in analyze_subscription_patterns: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return self._get_fallback_subscription_analysis()

    def _generate_plan_insights_with_nlp(self, plan, adoption_rate, avg_plan_users, global_avg_users, 
                                         subscriber_count, action_completion_rate, compliance_rate,
                                         feature_analysis, name_analysis):
        """Generate insights using NLP analysis of plan features"""
        insights = []
        recommendations = []
        suggested_changes = {}
        priority_score = 5
        risk_level = 'low'
        
        # NLP Insight: Feature complexity analysis
        if feature_analysis and feature_analysis.get('complexity'):
            complexity = feature_analysis['complexity']
            complexity_score = complexity.get('score', 0)
            insights.append("📝 Description des fonctionnalités analysée (complexité:  {})".format(complexity['level']))
            if complexity['level'] == 'Élevée':
                recommendations.append("Simplifier la description des fonctionnalités pour améliorer la conversion")
                priority_score += 1
        
        # NLP Insight:  Detected domain alignment
        if feature_analysis and feature_analysis.get('detected_domain'):
            domain = feature_analysis['detected_domain']
            if domain['confidence'] > 0.5:
                conf_percent = int(domain['confidence'] * 100)
                insights.append("🎯 Plan orienté {} (confiance: {}%)".format(domain['domain'], conf_percent))
        
        # NLP Insight: Key terms in features
        if feature_analysis and feature_analysis.get('key_terms'):
            top_terms = [t['lemma'] for t in feature_analysis['key_terms'][:3]]
            if top_terms: 
                insights.append("🔑 Termes clés des fonctionnalités:  {}".format(', '.join(top_terms)))
        
        # Statistical:  Adoption rate analysis
        if adoption_rate > 50:
            insights. append("✅ Excellent taux d'adoption ({:.1f}%)".format(adoption_rate))
            recommendations.append("Maintenir le positionnement actuel")
            priority_score += 1
        elif adoption_rate > 25:
            insights.append("📈 Bon taux d'adoption ({:.1f}%)".format(adoption_rate))
            recommendations. append("Opportunité d'optimisation pour augmenter l'adoption")
            priority_score += 2
        else:
            insights. append("⚠️ Faible taux d'adoption ({:.1f}%)".format(adoption_rate))
            recommendations.append("PRIORITÉ: Analyser les raisons du faible taux d'adoption")
            priority_score += 4
            risk_level = 'high'
        
        # Statistical: User limit analysis
        user_limit = plan. get('userLimit', 10)
        utilization = (avg_plan_users / user_limit) * 100 if user_limit > 0 else 0
        
        if utilization > 85:
            insights. append("🔴 Limite d'utilisateurs proche de saturation ({:.1f}%)".format(utilization))
            recommendations.append("URGENT: Augmenter la limite pour éviter frustration client")
            suggested_changes['userLimit'] = {
                'current':  user_limit,
                'suggested': int(user_limit * 1.5),
                'reason':  'Saturation imminente - risque de churn'
            }
            priority_score += 3
            risk_level = 'high'
        elif utilization > 70:
            insights.append("🟡 Bonne utilisation de la limite ({:.1f}%)".format(utilization))
            suggested_changes['userLimit'] = {
                'current': user_limit,
                'suggested': int(user_limit * 1.3),
                'reason': 'Anticipation de la croissance'
            }
            priority_score += 1
        
        # Pricing analysis
        base_price = plan.get('basePrice', 0)
        discount = plan.get('discount', 0)
        
        if discount == 0 and adoption_rate < 25:
            recommendations.append("Considérer l'ajout d'une réduction promotionnelle (10-15%)")
            suggested_changes['discount'] = {
                'current': 0,
                'suggested': 12,
                'reason': 'Stimuler l\'adoption avec incitation temporaire'
            }
            priority_score += 2
        
        if base_price < 50 and adoption_rate > 40:
            recommendations.append("💡 Opportunité d'optimisation tarifaire identifiée")
            suggested_changes['pricing'] = {
                'current': base_price,
                'suggested': round(base_price * 1.15, 2),
                'reason': 'Forte adoption ({:.1f}%) permet ajustement prix'.format(adoption_rate)
            }
        
        # Determine risk level
        if priority_score > 10:
            risk_level = 'critical'
        elif priority_score > 7:
            risk_level = 'high'
        elif priority_score > 5:
            risk_level = 'medium'
        
        return {
            'insights': insights,
            'recommendations': recommendations,
            'suggestedChanges': suggested_changes,
            'priorityScore':  min(priority_score, 10),
            'riskLevel':  risk_level
        }

    def _calculate_plan_similarities(self, plan_features_map):
        """Calculate semantic similarity between plans using spaCy"""
        similarities = []
        
        plan_ids = list(plan_features_map.keys())
        
        for i in range(len(plan_ids)):
            for j in range(i + 1, len(plan_ids)):
                plan1_id = plan_ids[i]
                plan2_id = plan_ids[j]
                
                text1 = plan_features_map[plan1_id]
                text2 = plan_features_map[plan2_id]
                
                if text1 and text2:
                    similarity = self.text_analyzer. calculate_text_similarity(text1, text2)
                    
                    if similarity > 0.7: 
                        similarities.append({
                            'plan1': plan1_id,
                            'plan2':  plan2_id,
                            'similarity': round(similarity, 2),
                            'warning': 'Plans très similaires - risque de cannibalisation'
                        })
                    elif similarity > 0.5:
                        similarities.append({
                            'plan1':  plan1_id,
                            'plan2': plan2_id,
                            'similarity': round(similarity, 2),
                            'note': 'Plans modérément similaires'
                        })
        
        return similarities

    def _generate_market_insights_with_nlp(self, statistics, subscription_dist, avg_users,
                                           action_completion_rate, compliance_rate,
                                           common_keywords, feature_similarities):
        """Generate market insights enhanced with NLP analysis"""
        insights = []
        
        total = statistics.get('totalCompanies', 0)
        active = statistics.get('activeCompanies', 0)
        
        if total > 0:
            activation_rate = (active / total) * 100
            insights.append({
                'type':  'activation',
                'icon': '📊',
                'text': "Taux d'activation des entreprises: {:.1f}%". format(activation_rate),
                'status': 'good' if activation_rate > 70 else 'warning' if activation_rate > 40 else 'critical'
            })
        
        insights.append({
            'type': 'usage',
            'icon': '👥',
            'text': "Moyenne d'utilisateurs par entreprise:  {:.1f}".format(avg_users),
            'status': 'info'
        })
        
        insights.append({
            'type': 'performance',
            'icon': '✅',
            'text': "Taux de complétion des actions:  {:.1f}%".format(action_completion_rate),
            'status':  'good' if action_completion_rate > 70 else 'warning'
        })
        
        insights.append({
            'type': 'compliance',
            'icon':  '📋',
            'text': "Taux de conformité:  {:.1f}%".format(compliance_rate),
            'status': 'good' if compliance_rate > 80 else 'warning'
        })
        
        # NLP Insight: Common keywords across plans
        if common_keywords:
            top_keywords = [kw['term'] for kw in common_keywords[:5]]
            insights. append({
                'type': 'nlp_keywords',
                'icon': '🔑',
                'text': "Termes dominants dans les offres: {}".format(', '.join(top_keywords)),
                'status': 'info'
            })
        
        # NLP Insight: Plan similarity warnings
        high_similarity_pairs = [s for s in feature_similarities if s. get('similarity', 0) > 0.7]
        if high_similarity_pairs: 
            insights.append({
                'type': 'nlp_similarity',
                'icon':  '⚠️',
                'text': "{} paire(s) de plans très similaires détectée(s) - Risque de cannibalisation".format(len(high_similarity_pairs)),
                'status': 'warning'
            })
        
        # Most popular plan
        if subscription_dist: 
            most_popular = max(subscription_dist, key=lambda x: x['count'])
            insights. append({
                'type': 'popularity',
                'icon': '🏆',
                'text': "Plan le plus populaire:  {} ({} abonnés)".format(most_popular['planName'], most_popular['count']),
                'status': 'good'
            })
            
            total_subscribers = sum(s['count'] for s in subscription_dist)
            concentration = (most_popular['count'] / max(total_subscribers, 1)) * 100
            
            if concentration > 60:
                insights. append({
                    'type': 'concentration',
                    'icon': '⚠️',
                    'text': "Forte concentration ({:.1f}%) sur un plan - Diversifier? ".format(concentration),
                    'status': 'warning'
                })
        
        return insights

    def _get_fallback_subscription_analysis(self):
        """Fallback analysis if main analysis fails"""
        return {
            'planSuggestions': [],
            'marketInsights': [{
                'type':  'error',
                'icon': '❌',
                'text':  "Analyse indisponible - Données insuffisantes",
                'status': 'critical'
            }],
            'analysisDate': datetime. now().isoformat(),
            'methodology': 'Fallback mode - Analyse indisponible',
            'globalMetrics': {},
            'nlpMetrics': {}
        }

    def _generate_actionable_updates(self, plan, suggested_changes):
        """Generate actionable update object for plan"""
        updates = {}
        
        for key, value in suggested_changes.items():
            if key == 'pricing':
                if isinstance(value, dict) and 'suggested' in value:
                    updates['basePrice'] = value['suggested']
                elif isinstance(value, str):
                    match = re.search(r'(\d+\. ?\d*)', str(value))
                    if match: 
                        updates['basePrice'] = float(match.group(1))
            
            elif key == 'discount':
                if isinstance(value, dict) and 'suggested' in value:
                    updates['discount'] = value['suggested']
                elif isinstance(value, str):
                    matches = re.findall(r'(\d+)', str(value))
                    if len(matches) >= 2:
                        updates['discount'] = (float(matches[0]) + float(matches[1])) / 2
                    elif len(matches) == 1:
                        updates['discount'] = float(matches[0])
            
            elif key == 'userLimit': 
                if isinstance(value, dict) and 'suggested' in value:
                    updates['userLimit'] = value['suggested']
        
        return updates


class PerformanceReportNLP:
    """
    Real NLP-based performance analysis using spaCy
    """
    
    def __init__(self):
        self.text_analyzer = text_analyzer
        
    def generate_performance_report(self, statistics):
        """Generate comprehensive NLP-based performance report"""
        try:
            total_companies = statistics. get('totalCompanies', 0)
            active_companies = statistics.get('activeCompanies', 0)
            subscription_dist = statistics. get('subscriptionDistribution', [])
            avg_users = statistics.get('avgUsersPerCompany', 0)
            total_actions = statistics. get('totalActions', 0)
            completed_actions = statistics.get('completedActions', 0)
            total_texts = statistics.get('totalTexts', 0)
            compliant_texts = statistics.get('compliantTexts', 0)
            
            # Calculate derived metrics
            activation_rate = (active_companies / max(total_companies, 1)) * 100
            action_completion_rate = (completed_actions / max(total_actions, 1)) * 100
            compliance_rate = (compliant_texts / max(total_texts, 1)) * 100
            
            # 1. Sentiment analysis of system health
            sentiment = self._analyze_system_sentiment(
                activation_rate, 
                action_completion_rate, 
                compliance_rate
            )
            
            # 2. Trend detection
            trend_analysis = self._detect_trends(subscription_dist, total_companies)
            
            # 3.  Anomaly detection
            anomalies = self._detect_anomalies(statistics)
            
            # 4. NLP-enhanced executive summary
            executive_summary = self._generate_executive_summary_nlp(
                sentiment,
                activation_rate,
                action_completion_rate,
                compliance_rate,
                trend_analysis,
                statistics
            )
            
            # 5. KPIs with NLP context
            kpis = self._extract_kpis(statistics)
            
            # 6. NLP-enhanced recommendations
            recommendations = self._generate_recommendations_nlp(
                sentiment,
                anomalies,
                kpis,
                statistics
            )
            
            # 7. Detailed sections with NLP analysis
            sections = {
                'user_engagement': self._analyze_user_engagement(avg_users, active_companies),
                'compliance_analysis': self._analyze_compliance(compliance_rate, compliant_texts, total_texts),
                'action_performance': self._analyze_action_performance(action_completion_rate, completed_actions, total_actions),
                'subscription_insights': self._analyze_subscriptions(subscription_dist, active_companies)
            }
            
            # 8. NLP Analysis of plan names and descriptions
            nlp_text_analysis = self._analyze_subscription_texts(subscription_dist)
            
            return {
                'success': True,
                'report': {
                    'metadata': {
                        'generated_at': datetime. now().isoformat(),
                        'report_period': 'Période Complète',
                        'analysis_method': 'Analyse NLP (spaCy) + Analyse Statistique',
                        'language': 'fr',
                        'nlp_model': 'fr_core_news_md'
                    },
                    'sentiment':  sentiment,
                    'executive_summary': executive_summary,
                    'kpis': kpis,
                    'trend_analysis': trend_analysis,
                    'anomalies':  anomalies,
                    'sections': sections,
                    'recommendations': recommendations,
                    'nlp_analysis': nlp_text_analysis,
                    'raw_metrics': {
                        'totalCompanies': total_companies,
                        'activeCompanies': active_companies,
                        'activationRate': round(activation_rate, 2),
                        'avgUsersPerCompany': round(avg_users, 2),
                        'actionCompletionRate':  round(action_completion_rate, 2),
                        'complianceRate':  round(compliance_rate, 2)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating performance report: {str(e)}")
            import traceback
            logger.error(traceback.format_exc())
            return self._get_fallback_report()
    
    def _analyze_subscription_texts(self, subscription_dist):
        """Use NLP to analyze plan names and extract patterns"""
        if not subscription_dist: 
            return {'analyzed': False, 'reason': 'Aucune donnée d\'abonnement'}
        
        plan_names = [s. get('planName', '') for s in subscription_dist if s.get('planName')]
        
        if not plan_names:
            return {'analyzed': False, 'reason': 'Aucun nom de plan disponible'}
        
        # Analyze each plan name
        plan_analyses = []
        all_keywords = []
        
        for name in plan_names: 
            analysis = self.text_analyzer.analyze_text(name)
            
            # Extract key info
            keywords = [t['lemma'] for t in analysis. get('key_terms', [])]
            all_keywords.extend(keywords)
            
            plan_analyses.append({
                'name': name,
                'keywords': keywords[: 3],
                'complexity': analysis.get('complexity', {}).get('level', 'Moyenne'),
                'detected_positioning': analysis.get('detected_domain', {}).get('domain', 'général')
            })
        
        # Find common themes across plans
        keyword_freq = Counter(all_keywords)
        common_themes = [{'term': term, 'count':  count} for term, count in keyword_freq. most_common(5)]
        
        return {
            'analyzed': True,
            'plan_analyses': plan_analyses,
            'common_themes': common_themes,
            'total_plans_analyzed': len(plan_names)
        }
    
    def _analyze_system_sentiment(self, activation_rate, action_rate, compliance_rate):
        """Sentiment analysis based on performance indicators"""
        weights = {'activation': 0.3, 'action':  0.4, 'compliance':  0.3}
        
        score = (
            (activation_rate * weights['activation']) +
            (action_rate * weights['action']) +
            (compliance_rate * weights['compliance'])
        )
        
        if score >= 75:
            sentiment = 'excellent'
            emoji = '🎉'
            description = "Performance exceptionnelle du système"
            color = '#10B981'
        elif score >= 60:
            sentiment = 'good'
            emoji = '✅'
            description = "Performance satisfaisante avec opportunités d'amélioration"
            color = '#3B82F6'
        elif score >= 40:
            sentiment = 'moderate'
            emoji = '⚠️'
            description = "Performance modérée nécessitant des actions correctives"
            color = '#F59E0B'
        else:
            sentiment = 'critical'
            emoji = '🔴'
            description = "Performance critique nécessitant une intervention immédiate"
            color = '#EF4444'
        
        return {
            'score': round(score, 2),
            'level': sentiment,
            'emoji': emoji,
            'description':  description,
            'color': color,
            'components': {
                'activation': round(activation_rate, 2),
                'action_completion': round(action_rate, 2),
                'compliance':  round(compliance_rate, 2)
            }
        }
    
    def _detect_trends(self, subscription_dist, total_companies):
        """Trend detection using statistical analysis"""
        if not subscription_dist or len(subscription_dist) < 2:
            return {
                'direction': 'stable',
                'confidence': 0,
                'description': 'Données insuffisantes pour l\'analyse de tendance',
                'emoji': '➡️',
                'metrics': {}
            }
        
        subscriber_counts = [s.get('count', 0) for s in subscription_dist]
        total_subscribers = sum(subscriber_counts)
        avg_per_plan = total_subscribers / len(subscriber_counts)
        
        # Variance analysis
        variance = float(np.var(subscriber_counts)) if len(subscriber_counts) > 1 else 0
        std_dev = float(np.std(subscriber_counts)) if len(subscriber_counts) > 1 else 0
        
        # Use linear regression to detect trend direction
        if len(subscriber_counts) >= 3:
            X = np.array(range(len(subscriber_counts))).reshape(-1, 1)
            y = np.array(subscriber_counts)
            
            reg = LinearRegression()
            reg.fit(X, y)
            
            slope = float(reg.coef_[0])
            r_squared = float(reg.score(X, y))
            
            if slope > 0.5 and r_squared > 0.5:
                direction = 'croissance_forte'
                emoji = '📈'
                description = "Tendance à la hausse détectée (pente:  {:.2f}, R²: {:. 2f})".format(slope, r_squared)
            elif slope > 0:
                direction = 'croissance_stable'
                emoji = '➡️'
                description = "Croissance légère observée (pente:  {:.2f})".format(slope)
            elif slope < -0.5:
                direction = 'déclin'
                emoji = '📉'
                description = "Tendance à la baisse détectée - Action requise"
            else:
                direction = 'stable'
                emoji = '➡️'
                description = "Tendance stable observée"
        else:
            direction = 'stable'
            emoji = '➡️'
            slope = 0
            r_squared = 0
            description = "Adoption stable avec {} abonnements actifs".format(total_subscribers)
        
        return {
            'direction': direction,
            'emoji': emoji,
            'description': description,
            'metrics': {
                'total_subscribers': total_subscribers,
                'avg_per_plan': round(avg_per_plan, 2),
                'distribution_variance': round(variance, 2),
                'std_deviation': round(std_dev, 2),
                'plan_count': len(subscriber_counts),
                'trend_slope': round(slope, 4),
                'r_squared': round(r_squared, 4)
            }
        }
    
    def _detect_anomalies(self, statistics):
        """Statistical anomaly detection using thresholds"""
        anomalies = []
        
        total_companies = statistics.get('totalCompanies', 0)
        active_companies = statistics. get('activeCompanies', 0)
        avg_users = statistics.get('avgUsersPerCompany', 0)
        total_actions = statistics.get('totalActions', 0)
        completed_actions = statistics. get('completedActions', 0)
        total_texts = statistics.get('totalTexts', 0)
        compliant_texts = statistics.get('compliantTexts', 0)
        
        # Anomaly 1: Low activation rate
        if total_companies > 0: 
            activation_rate = (active_companies / total_companies) * 100
            if activation_rate < 50:
                anomalies.append({
                    'type':  'activation_faible',
                    'severity': 'high',
                    'emoji': '⚠️',
                    'description': "Taux d'activation faible détecté ({:.1f}%) - Moins de 50% des entreprises sont actives".format(activation_rate),
                    'value': round(activation_rate, 2),
                    'threshold': 50,
                    'nlp_context': self._get_anomaly_nlp_context('activation_faible')
                })
        
        # Anomaly 2:  Abnormal user count
        if avg_users < 2:
            anomalies.append({
                'type': 'utilisateurs_faible',
                'severity': 'medium',
                'emoji': '👥',
                'description': "Moyenne d'utilisateurs par entreprise faible ({:.1f}) - Sous-utilisation potentielle".format(avg_users),
                'value': round(avg_users, 2),
                'threshold': 2,
                'nlp_context': self._get_anomaly_nlp_context('utilisateurs_faible')
            })
        elif avg_users > 50:
            anomalies.append({
                'type': 'utilisateurs_eleve',
                'severity': 'info',
                'emoji': '📊',
                'description': "Engagement élevé détecté ({:.1f} utilisateurs/entreprise) - Opportunité d'upselling".format(avg_users),
                'value': round(avg_users, 2),
                'threshold': 50,
                'nlp_context': self._get_anomaly_nlp_context('utilisateurs_eleve')
            })
        
        # Anomaly 3: Action completion analysis
        if total_actions > 0:
            completion_rate = (completed_actions / total_actions) * 100
            if completion_rate < 40:
                anomalies.append({
                    'type':  'completion_faible',
                    'severity':  'high',
                    'emoji':  '📋',
                    'description': "Taux de complétion des actions critiquement bas ({:.1f}%)".format(completion_rate),
                    'value': round(completion_rate, 2),
                    'threshold': 40,
                    'nlp_context':  self._get_anomaly_nlp_context('completion_faible')
                })
        
        # Anomaly 4: Compliance gap
        if total_texts > 0:
            compliance_rate = (compliant_texts / total_texts) * 100
            if compliance_rate < 60:
                anomalies.append({
                    'type':  'conformite_faible',
                    'severity': 'high',
                    'emoji': '⚖️',
                    'description': "Écart de conformité significatif détecté ({:.1f}%)".format(compliance_rate),
                    'value': round(compliance_rate, 2),
                    'threshold': 60,
                    'nlp_context':  self._get_anomaly_nlp_context('conformite_faible')
                })
        
        return anomalies
    
    def _get_anomaly_nlp_context(self, anomaly_type):
        """Get NLP-generated context for anomaly types"""
        contexts = {
            'activation_faible': {
                'causes_probables': [
                    'Processus d\'onboarding complexe',
                    'Manque de formation initiale',
                    'Interface utilisateur peu intuitive'
                ],
                'impact_business': 'Réduction du ROI sur acquisition client',
                'urgence':  'Élevée'
            },
            'utilisateurs_faible': {
                'causes_probables': [
                    'Limites de licence restrictives',
                    'Manque de sensibilisation interne',
                    'Fonctionnalités non adaptées aux équipes'
                ],
                'impact_business': 'Sous-exploitation de la plateforme',
                'urgence': 'Moyenne'
            },
            'utilisateurs_eleve':  {
                'causes_probables': [
                    'Forte adoption organique',
                    'Besoins métier bien adressés',
                    'Champions internes actifs'
                ],
                'impact_business': 'Opportunité de croissance revenue',
                'urgence': 'Faible - Opportunité'
            },
            'completion_faible': {
                'causes_probables':  [
                    'Actions mal définies ou trop complexes',
                    'Manque de ressources assignées',
                    'Délais irréalistes'
                ],
                'impact_business': 'Risque de non-conformité et retards projets',
                'urgence': 'Élevée'
            },
            'conformite_faible': {
                'causes_probables': [
                    'Évolutions réglementaires non suivies',
                    'Manque d\'expertise interne',
                    'Processus de mise à jour inefficace'
                ],
                'impact_business': 'Risque légal et financier',
                'urgence': 'Critique'
            }
        }
        return contexts.get(anomaly_type, {})
    
    def _generate_executive_summary_nlp(self, sentiment, activation, action_rate, compliance, trend, statistics):
        """Generate executive summary using NLP-enhanced natural language generation"""
        
        summary_parts = []
        
        # Opening based on sentiment
        if sentiment['level'] == 'excellent':
            summary_parts.append("🎉 **Performance Exceptionnelle** - Le système affiche des résultats remarquables avec un score global de {:.1f}/100.".format(sentiment['score']))
        elif sentiment['level'] == 'good': 
            summary_parts. append("✅ **Performance Satisfaisante** - Le système présente de bons indicateurs avec un score de {:.1f}/100, offrant des opportunités d'optimisation.".format(sentiment['score']))
        elif sentiment['level'] == 'moderate':
            summary_parts.append("⚠️ **Attention Requise** - Le système nécessite une attention particulière avec un score de {:.1f}/100.".format(sentiment['score']))
        else:
            summary_parts.append("🔴 **Intervention Urgente** - Le système requiert une action immédiate avec un score critique de {:.1f}/100.".format(sentiment['score']))
        
        # Activation analysis
        if activation >= 70:
            summary_parts.append("\n\n**Activation Client:** L'adoption est forte avec {:.1f}% des entreprises actives, démontrant une excellente pénétration marché.".format(activation))
        elif activation >= 50:
            summary_parts.append("\n\n**Activation Client:** Le taux d'activation de {:.1f}% est acceptable mais présente un potentiel d'amélioration significatif.".format(activation))
        else:
            summary_parts.append("\n\n**Activation Client:** ⚠️ Le taux d'activation de {:.1f}% est préoccupant et nécessite une stratégie d'engagement urgente.".format(activation))
        
        # Action completion
        if action_rate >= 70:
            summary_parts. append("\n\n**Exécution des Actions:** Excellence opérationnelle avec {:.1f}% de taux de complétion. ".format(action_rate))
        elif action_rate >= 50:
            summary_parts.append("\n\n**Exécution des Actions:** Taux de complétion de {:.1f}% - Des optimisations de processus sont recommandées.".format(action_rate))
        else: 
            summary_parts. append("\n\n**Exécution des Actions:** ⚠️ Taux de complétion critique de {:.1f}% révélant des blocages opérationnels majeurs.".format(action_rate))
        
        # Compliance
        if compliance >= 80:
            summary_parts.append("\n\n**Conformité Réglementaire:** Niveau exemplaire de {:.1f}% assurant une protection juridique optimale.".format(compliance))
        elif compliance >= 60:
            summary_parts.append("\n\n**Conformité Réglementaire:** Niveau de {:.1f}% satisfaisant avec des axes d'amélioration identifiés.".format(compliance))
        else:
            summary_parts.append("\n\n**Conformité Réglementaire:** ⚠️ Écart significatif à {:.1f}% exposant l'organisation à des risques légaux.".format(compliance))
        
        # Trend conclusion
        summary_parts.append("\n\n**Tendance:** {} {}".format(trend['emoji'], trend['description']))
        
        # Key numbers
        total_companies = statistics. get('totalCompanies', 0)
        active_companies = statistics.get('activeCompanies', 0)
        avg_users = statistics.get('avgUsersPerCompany', 0)
        summary_parts.append("\n\n**Chiffres Clés:** {} entreprises | {} actives | {:.1f} utilisateurs/entreprise en moyenne".format(total_companies, active_companies, avg_users))
        
        return "".join(summary_parts)
    
    def _extract_kpis(self, statistics):
        """Extract KPIs with NLP-enhanced descriptions"""
        total_companies = statistics. get('totalCompanies', 0)
        active_companies = statistics.get('activeCompanies', 0)
        total_actions = statistics. get('totalActions', 0)
        completed_actions = statistics.get('completedActions', 0)
        total_texts = statistics.get('totalTexts', 0)
        compliant_texts = statistics.get('compliantTexts', 0)
        avg_users = statistics. get('avgUsersPerCompany', 0)
        
        activation_rate = (active_companies / max(total_companies, 1)) * 100
        action_rate = (completed_actions / max(total_actions, 1)) * 100
        compliance_rate = (compliant_texts / max(total_texts, 1)) * 100
        
        kpis = [
            {
                'name': 'Taux d\'Activation',
                'value': round(activation_rate, 2),
                'unit': '%',
                'category': 'adoption',
                'trend': 'up' if activation_rate > 60 else 'down' if activation_rate < 40 else 'neutral',
                'description': "{} entreprises actives sur {}".format(active_companies, total_companies),
                'nlp_insight': self._generate_kpi_insight('activation', activation_rate)
            },
            {
                'name': 'Engagement Utilisateur',
                'value': round(avg_users, 2),
                'unit': ' utilisateurs/entreprise',
                'category': 'engagement',
                'trend':  'up' if avg_users > 3 else 'neutral',
                'description': "Moyenne de {:.1f} utilisateurs par entreprise".format(avg_users),
                'nlp_insight': self._generate_kpi_insight('engagement', avg_users)
            },
            {
                'name': 'Exécution des Actions',
                'value':  round(action_rate, 2),
                'unit': '%',
                'category': 'performance',
                'trend': 'up' if action_rate > 60 else 'down' if action_rate < 40 else 'neutral',
                'description': "{} actions complétées sur {}". format(completed_actions, total_actions),
                'nlp_insight': self._generate_kpi_insight('actions', action_rate)
            },
            {
                'name': 'Conformité Réglementaire',
                'value':  round(compliance_rate, 2),
                'unit': '%',
                'category': 'compliance',
                'trend': 'up' if compliance_rate > 70 else 'down' if compliance_rate < 50 else 'neutral',
                'description': "{} textes conformes sur {}".format(compliant_texts, total_texts),
                'nlp_insight':  self._generate_kpi_insight('compliance', compliance_rate)
            }
        ]
        
        return kpis
    
    def _generate_kpi_insight(self, kpi_type, value):
        """Generate NLP-style insight for each KPI"""
        insights = {
            'activation':  {
                'high':  "Excellente adoption démontrant une proposition de valeur claire",
                'medium': "Adoption modérée suggérant des opportunités d'amélioration de l'onboarding",
                'low': "Adoption faible nécessitant une révision de la stratégie d'engagement"
            },
            'engagement': {
                'high':  "Fort engagement indiquant une utilisation collaborative efficace",
                'medium': "Engagement standard avec potentiel de croissance",
                'low': "Engagement limité suggérant des barrières à l'adoption interne"
            },
            'actions':  {
                'high': "Exécution efficace reflétant des processus bien définis",
                'medium': "Exécution acceptable avec marge d'optimisation",
                'low': "Exécution problématique révélant des obstacles opérationnels"
            },
            'compliance': {
                'high': "Conformité exemplaire assurant une protection réglementaire",
                'medium':  "Conformité partielle nécessitant un suivi renforcé",
                'low': "Écart de conformité critique exposant à des risques légaux"
            }
        }
        
        if kpi_type == 'engagement':
            level = 'high' if value > 5 else 'low' if value < 2 else 'medium'
        else:
            level = 'high' if value > 70 else 'low' if value < 40 else 'medium'
        
        return insights.get(kpi_type, {}).get(level, "Analyse en cours")
    
    def _generate_recommendations_nlp(self, sentiment, anomalies, kpis, statistics):
        """Generate NLP-enhanced actionable recommendations"""
        recommendations = []
        
        # Priority 1: Address critical anomalies
        critical_anomalies = [a for a in anomalies if a. get('severity') == 'high']
        for anomaly in critical_anomalies: 
            nlp_context = anomaly.get('nlp_context', {})
            recommendations. append({
                'priority': 'high',
                'category': anomaly['type'],
                'emoji': '🔴',
                'title': "Action Prioritaire: {}".format(anomaly['type']. replace('_', ' ').title()),
                'description': anomaly['description'],
                'causes_probables': nlp_context.get('causes_probables', []),
                'impact_business':  nlp_context. get('impact_business', 'Impact à évaluer'),
                'actions':  self._get_remediation_actions(anomaly['type']),
                'urgence': nlp_context.get('urgence', 'Élevée')
            })
        
        # Priority 2: Optimization based on KPI analysis
        for kpi in kpis:
            if kpi['trend'] == 'down' or kpi['value'] < 50:
                recommendations.append({
                    'priority': 'medium',
                    'category': kpi['category'],
                    'emoji':  '⚠️',
                    'title':  "Optimisation:  {}".format(kpi['name']),
                    'description': "{} à {}{} - {}".format(kpi['name'], kpi['value'], kpi['unit'], kpi['nlp_insight']),
                    'actions': self._get_optimization_actions(kpi['category']),
                    'expected_impact': "Amélioration potentielle de {}".format(kpi['name'])
                })
        
        # Priority 3: Growth opportunities
        if sentiment['level'] in ['excellent', 'good']: 
            recommendations.append({
                'priority': 'low',
                'category': 'growth',
                'emoji':  '🚀',
                'title': "Opportunité de Croissance",
                'description':  "Performance solide - Moment propice pour l'expansion",
                'actions': [
                    "Lancer campagne d'acquisition de nouveaux clients",
                    "Développer fonctionnalités premium basées sur l'usage actuel",
                    "Renforcer programme de fidélisation",
                    "Explorer nouveaux segments de marché"
                ],
                'expected_impact': "Augmentation du revenu et de la base client"
            })
        
        # Priority 4: Upselling opportunity
        avg_users = statistics.get('avgUsersPerCompany', 0)
        if avg_users > 10:
            recommendations. append({
                'priority': 'medium',
                'category': 'upsell',
                'emoji': '💡',
                'title': "Opportunité d'Upselling Détectée",
                'description': "Moyenne élevée d'utilisateurs ({:.1f}/entreprise) suggère un besoin de plans supérieurs".format(avg_users),
                'actions': [
                    "Identifier entreprises proches des limites de leur plan",
                    "Proposer migration vers plans supérieurs",
                    "Développer offres entreprise personnalisées"
                ],
                'expected_impact': "Augmentation de l'ARPU (Average Revenue Per User)"
            })
        
        return recommendations
    
    def _get_remediation_actions(self, anomaly_type):
        """Get specific remediation actions"""
        actions_map = {
            'activation_faible': [
                "Analyser le parcours d'onboarding avec des tests utilisateurs",
                "Mettre en place un programme d'accompagnement personnalisé",
                "Créer des tutoriels interactifs et guides de démarrage",
                "Contacter proactivement les entreprises inactives sous 30 jours"
            ],
            'completion_faible': [
                "Auditer les actions bloquées pour identifier les patterns",
                "Simplifier le workflow de validation des actions",
                "Implémenter des rappels automatiques intelligents",
                "Former les utilisateurs sur les bonnes pratiques d'exécution"
            ],
            'conformite_faible':  [
                "Prioriser la mise en conformité des textes à haut risque",
                "Renforcer l'équipe conformité temporairement",
                "Automatiser la veille réglementaire",
                "Mettre en place des audits de conformité mensuels"
            ],
            'utilisateurs_faible': [
                "Lancer une campagne interne de sensibilisation",
                "Offrir des sessions de formation gratuites",
                "Simplifier le processus d'invitation d'utilisateurs",
                "Démontrer la valeur de la collaboration multi-utilisateurs"
            ]
        }
        return actions_map.get(anomaly_type, ["Analyser la situation en détail", "Définir un plan d'action correctif"])
    
    def _get_optimization_actions(self, category):
        """Get optimization actions by category"""
        actions_map = {
            'performance': [
                "Optimiser les workflows d'exécution des actions",
                "Mettre en place des tableaux de bord de suivi temps réel",
                "Définir des objectifs SMART par équipe et individu",
                "Automatiser les tâches répétitives"
            ],
            'compliance': [
                "Automatiser la veille réglementaire sectorielle",
                "Standardiser les processus d'évaluation de conformité",
                "Former les équipes aux nouvelles exigences",
                "Implémenter des alertes proactives pré-échéance"
            ],
            'engagement': [
                "Gamifier l'expérience utilisateur avec des badges",
                "Envoyer des notifications intelligentes et contextuelles",
                "Créer une communauté utilisateurs active",
                "Personnaliser l'interface selon les rôles"
            ],
            'adoption': [
                "Optimiser le parcours d'onboarding",
                "Créer du contenu éducatif ciblé",
                "Mettre en place un programme de parrainage",
                "Offrir un support proactif aux nouveaux clients"
            ]
        }
        return actions_map.get(category, ["Analyser les métriques en détail", "Tester des améliorations ciblées"])
    
    def _analyze_user_engagement(self, avg_users, active_companies):
        """Detailed user engagement analysis"""
        total_users = avg_users * active_companies
        
        if avg_users >= 5:
            level = 'excellent'
            emoji = '🌟'
            insight = "Engagement exceptionnel avec {:.1f} utilisateurs par entreprise en moyenne".format(avg_users)
            nlp_analysis = "Pattern d'adoption collaborative détecté"
        elif avg_users >= 3:
            level = 'good'
            emoji = '✅'
            insight = "Bon niveau d'engagement ({:.1f} utilisateurs/entreprise)".format(avg_users)
            nlp_analysis = "Adoption standard avec potentiel d'expansion interne"
        elif avg_users >= 2:
            level = 'moderate'
            emoji = '➡️'
            insight = "Engagement modéré ({:.1f} utilisateurs/entreprise)".format(avg_users)
            nlp_analysis = "Usage limité suggérant des barrières à l'adoption"
        else:
            level = 'low'
            emoji = '⚠️'
            insight = "Engagement faible ({:.1f} utilisateurs/entreprise)".format(avg_users)
            nlp_analysis = "Pattern d'usage mono-utilisateur détecté"
        
        return {
            'level': level,
            'emoji': emoji,
            'insight': insight,
            'nlp_analysis': nlp_analysis,
            'metrics': {
                'avg_users_per_company': round(avg_users, 2),
                'total_active_users': int(total_users),
                'active_companies': active_companies
            },
            'recommendations':  [
                "Encourager la collaboration inter-équipes",
                "Proposer des formations gratuites pour nouveaux utilisateurs",
                "Simplifier le processus d'invitation d'utilisateurs"
            ]
        }
    
    def _analyze_compliance(self, rate, compliant, total):
        """Detailed compliance analysis"""
        gap = total - compliant
        
        if rate >= 80:
            status = 'excellent'
            emoji = '✅'
            message = "Conformité exemplaire"
            risk_level = "Faible"
        elif rate >= 60:
            status = 'good'
            emoji = '👍'
            message = "Conformité satisfaisante"
            risk_level = "Modéré"
        else:
            status = 'critical'
            emoji = '⚠️'
            message = "Écart de conformité significatif"
            risk_level = "Élevé"
        
        return {
            'status': status,
            'emoji': emoji,
            'message':  message,
            'rate': round(rate, 2),
            'gap': gap,
            'risk_level': risk_level,
            'metrics': {
                'compliant_texts': compliant,
                'total_texts': total,
                'non_compliant':  gap
            },
            'priority_actions': [
                "Traiter les {} textes non-conformes par ordre de criticité".format(gap),
                "Mettre en place une revue mensuelle de conformité",
                "Automatiser les alertes pour nouvelles réglementations"
            ]
        }
    
    def _analyze_action_performance(self, rate, completed, total):
        """Detailed action performance analysis"""
        pending = total - completed
        
        if rate >= 75:
            performance = 'excellent'
            emoji = '🎯'
            message = "Excellente exécution des plans d'action"
            efficiency = "Haute"
        elif rate >= 50:
            performance = 'good'
            emoji = '✓'
            message = "Exécution satisfaisante des actions"
            efficiency = "Moyenne"
        else:
            performance = 'needs_improvement'
            emoji = '⚠️'
            message = "Exécution des actions à améliorer"
            efficiency = "Faible"
        
        return {
            'performance': performance,
            'emoji': emoji,
            'message': message,
            'rate':  round(rate, 2),
            'efficiency': efficiency,
            'metrics': {
                'completed':  completed,
                'total': total,
                'pending': pending,
                'completion_rate': round(rate, 2)
            },
            'insights': [
                "{} actions complétées avec succès".format(completed),
                "{} actions en cours nécessitent un suivi".format(pending),
                "Taux de réussite:  {:.1f}%".format(rate)
            ]
        }
    
    def _analyze_subscriptions(self, subscription_dist, active_companies):
        """Detailed subscription analysis"""
        if not subscription_dist: 
            return {
                'status': 'no_data',
                'message': 'Aucune donnée d\'abonnement disponible',
                'emoji': '📊'
            }
        
        total_subscribers = sum(s. get('count', 0) for s in subscription_dist)
        most_popular = max(subscription_dist, key=lambda x:  x.get('count', 0))
        least_popular = min(subscription_dist, key=lambda x: x.get('count', 0))
        
        penetration_rate = (total_subscribers / max(active_companies, 1)) * 100
        
        # Calculate concentration index
        if total_subscribers > 0:
            shares = [(s.get('count', 0) / total_subscribers) ** 2 for s in subscription_dist]
            concentration_index = sum(shares)
        else: 
            concentration_index = 0
        
        return {
            'penetration_rate': round(penetration_rate, 2),
            'total_subscribers': total_subscribers,
            'most_popular_plan': most_popular.get('planName', 'N/A'),
            'least_popular_plan': least_popular.get('planName', 'N/A'),
            'plan_count': len(subscription_dist),
            'concentration_index': round(concentration_index, 3),
            'emoji': '📊',
            'message': "Analyse de {} plans d'abonnement".format(len(subscription_dist)),
            'distribution': [
                {
                    'plan': s.get('planName'),
                    'subscribers': s.get('count'),
                    'percentage': round((s.get('count', 0) / max(total_subscribers, 1)) * 100, 2)
                }
                for s in subscription_dist
            ],
            'insights':  [
                "Plan le plus populaire:  {} ({} abonnés)".format(most_popular. get('planName'), most_popular.get('count')),
                "Taux de pénétration: {:.1f}% des entreprises actives".format(penetration_rate),
                "{} plans d'abonnement disponibles".format(len(subscription_dist))
            ],
            'market_health': 'Diversifié' if concentration_index < 0.4 else 'Concentré' if concentration_index > 0.6 else 'Modéré'
        }
    
    def _get_fallback_report(self):
        """Fallback report when analysis fails"""
        return {
            'success': False,
            'report': {
                'metadata': {
                    'generated_at': datetime. now().isoformat(),
                    'status': 'error',
                    'analysis_method': 'Fallback - Données insuffisantes'
                },
                'executive_summary': '❌ Impossible de générer le rapport - données insuffisantes ou erreur de traitement.',
                'sentiment': {
                    'score': 0,
                    'level': 'unknown',
                    'emoji': '❌',
                    'description': 'Analyse indisponible',
                    'color': '#6B7280'
                },
                'kpis': [],
                'trend_analysis': {
                    'direction': 'unknown',
                    'emoji': '❓',
                    'description': 'Analyse de tendance indisponible'
                },
                'anomalies': [],
                'sections': {},
                'recommendations':  [{
                    'priority': 'high',
                    'title': 'Vérifier les données',
                    'description': 'Les statistiques système sont incomplètes ou inaccessibles',
                    'emoji': '⚠️',
                    'actions':  [
                        'Vérifier la connexion à la base de données',
                        'Recharger les statistiques depuis le backend'
                    ]
                }]
            }
        }


# Initialize services
nlp_service = NLPService()
performance_nlp = PerformanceReportNLP()


# ============== API ENDPOINTS ==============

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    nlp_status = "loaded" if nlp else "not_loaded"
    return jsonify({
        "status": "healthy",
        "service": "Service d'Analyse NLP",
        "nlp_model":  nlp_status,
        "model_name": "fr_core_news_md" if nlp else None
    })


@app.route('/analyze-action', methods=['POST'])
def analyze_action():
    """Analyze action plan description and generate tips using NLP + Gemini"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data: 
            return jsonify({"error": "Description requise"}), 400
        
        description = data['description']
        domain = data.get('domain')
        theme = data.get('theme')
        
        analysis = nlp_service.analyze_action_description(description, domain, theme)
        
        return jsonify({
            "success": True,
            "analysis": analysis,
            "nlp_used": True,
            "model":  "spaCy fr_core_news_md + Gemini"
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_action endpoint: {str(e)}")
        return jsonify({
            "success":  False,
            "error": "Erreur interne du serveur",
            "analysis": nlp_service._get_fallback_response(data. get('description', ''))
        }), 200


@app.route('/suggest-taxonomy', methods=['POST'])
def suggest_taxonomy():
    """Generate taxonomy suggestions using AI"""
    try: 
        data = request.get_json()
        existing_domains = data.get('existing_domains', []) if data else []
        
        suggestion = nlp_service.generate_taxonomy_suggestion(existing_domains)
        
        return jsonify({
            "success": True,
            "suggestion":  suggestion
        })
        
    except Exception as e:
        logger. error(f"Error in suggest_taxonomy endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error":  "Erreur interne du serveur",
            "suggestion":  nlp_service._get_fallback_taxonomy_response()
        }), 200


@app. route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple action descriptions at once with NLP"""
    try:
        data = request.get_json()
        
        if not data or 'actions' not in data: 
            return jsonify({"error": "Tableau d'actions requis"}), 400
        
        actions = data['actions']
        results = []
        
        for action in actions:
            if 'description' in action:
                analysis = nlp_service.analyze_action_description(
                    action['description'],
                    action.get('domain'),
                    action. get('theme')
                )
                results.append({
                    "actionId": action.get('actionId'),
                    "analysis": analysis
                })
        
        return jsonify({
            "success":  True,
            "results": results,
            "nlp_used": True,
            "count": len(results)
        })
        
    except Exception as e:
        logger.error(f"Error in batch_analyze endpoint: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur"}), 500


@app.route('/test-model', methods=['GET'])
def test_model():
    """Test endpoint to verify model availability"""
    try:
        # List available Gemini models
        models = genai.list_models()
        available_models = [model. name for model in models]
        
        # Test spaCy
        spacy_test = None
        if nlp:
            test_doc = nlp("Ceci est un test de traitement du langage naturel.")
            spacy_test = {
                "tokens": [token.text for token in test_doc],
                "entities": [(ent.text, ent.label_) for ent in test_doc. ents],
                "noun_chunks": [chunk.text for chunk in test_doc.noun_chunks]
            }
        
        return jsonify({
            "success": True,
            "gemini_models": available_models,
            "current_gemini_model": "gemini-flash-latest",
            "spacy_model": "fr_core_news_md" if nlp else "not_loaded",
            "spacy_test": spacy_test
        })
        
    except Exception as e:
        logger.error(f"Error testing model: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app. route('/analyze-text', methods=['POST'])
def analyze_text():
    """Direct NLP text analysis endpoint"""
    try: 
        data = request.get_json()
        
        if not data or 'text' not in data:
            return jsonify({"error": "Texte requis"}), 400
        
        text = data['text']
        analysis = text_analyzer.analyze_text(text)
        
        return jsonify({
            "success": True,
            "analysis": analysis,
            "nlp_model": "fr_core_news_md" if nlp else "fallback"
        })
        
    except Exception as e: 
        logger.error(f"Error in analyze_text endpoint: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur"}), 500


@app.route('/analyze-subscription-performance', methods=['POST'])
def analyze_subscription_performance():
    """Analyze subscription plans using NLP + statistical analysis"""
    try:
        data = request.get_json()
        
        if not data: 
            return jsonify({"error": "Données requises"}), 400
        
        statistics = data.get('statistics', {})
        plans = data.get('plans', [])
        
        if not statistics or not plans: 
            return jsonify({"error": "Statistiques et plans requis"}), 400
        
        analysis = nlp_service.analyze_subscription_patterns(statistics, plans)
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
        
    except Exception as e:
        logger. error(f"Error in analyze_subscription_performance endpoint: {str(e)}")
        return jsonify({
            "success":  False,
            "error": "Erreur interne du serveur",
            "analysis": nlp_service._get_fallback_subscription_analysis()
        }), 200


@app.route('/generate-performance-report', methods=['POST'])
def generate_performance_report():
    """Generate comprehensive NLP-based performance report"""
    try:
        data = request.get_json()
        
        if not data or 'statistics' not in data: 
            return jsonify({"error": "Statistiques requises"}), 400
        
        statistics = data['statistics']
        report = performance_nlp.generate_performance_report(statistics)
        
        return jsonify(report)
        
    except Exception as e:
        logger. error(f"Error in generate_performance_report endpoint: {str(e)}")
        return jsonify({
            "success":  False,
            "error": "Erreur interne du serveur",
            "report": performance_nlp._get_fallback_report()
        }), 200


@app.route('/text-similarity', methods=['POST'])
def text_similarity():
    """Calculate semantic similarity between two texts"""
    try:
        data = request.get_json()
        
        if not data or 'text1' not in data or 'text2' not in data:
            return jsonify({"error": "Deux textes requis (text1, text2)"}), 400
        
        text1 = data['text1']
        text2 = data['text2']
        
        similarity = text_analyzer.calculate_text_similarity(text1, text2)
        
        return jsonify({
            "success": True,
            "similarity": round(similarity, 4),
            "interpretation": "Très similaires" if similarity > 0.8 else "Similaires" if similarity > 0.6 else "Peu similaires" if similarity > 0.4 else "Différents"
        })
        
    except Exception as e: 
        logger.error(f"Error in text_similarity endpoint: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur"}), 500


@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    """Extract keywords from multiple texts using TF-IDF"""
    try: 
        data = request. get_json()
        
        if not data or 'texts' not in data: 
            return jsonify({"error": "Liste de textes requise"}), 400
        
        texts = data['texts']
        
        if not isinstance(texts, list) or len(texts) == 0:
            return jsonify({"error": "Liste de textes non vide requise"}), 400
        
        keywords = text_analyzer. extract_keywords_tfidf(texts)
        
        return jsonify({
            "success": True,
            "keywords":  keywords,
            "method": "TF-IDF"
        })
        
    except Exception as e:
        logger.error(f"Error in extract_keywords endpoint: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur"}), 500


if __name__ == '__main__':
    port = int(os. getenv('FLASK_PORT', 5000))
    logger.info("Starting NLP Service on port {}".format(port))
    logger.info("spaCy model loaded: {}".format(nlp is not None))
    app.run(host='0.0.0.0', port=port, debug=True)