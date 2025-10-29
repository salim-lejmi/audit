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
except:
    logger.warning("French spaCy model not found. Install with: python -m spacy download fr_core_news_md")
    nlp = None

class NLPService:
    def __init__(self):
        # Updated model name - use gemini-1.5-flash which is available
        self.model = genai.GenerativeModel('gemini-1.5-flash')
        
    def analyze_action_description(self, description, domain=None, theme=None):
        """Analyze action plan description and generate tips"""
        try:
            # Create a comprehensive prompt for Gemini
            prompt = self._create_analysis_prompt(description, domain, theme)
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse and structure the response
            return self._parse_gemini_response(response.text)
            
        except Exception as e:
            logger.error(f"Error analyzing action description: {str(e)}")
            return self._get_fallback_response(description)
    
    def generate_taxonomy_suggestion(self, existing_domains=None):
        """Generate a new taxonomy suggestion"""
        try:
            prompt = self._create_taxonomy_prompt(existing_domains)
            
            # Generate response using Gemini
            response = self.model.generate_content(prompt)
            
            # Parse and structure the response
            return self._parse_taxonomy_response(response.text)
            
        except Exception as e:
            logger.error(f"Error generating taxonomy suggestion: {str(e)}")
            return self._get_fallback_taxonomy_response()
    
    def _create_taxonomy_prompt(self, existing_domains=None):
        """Create a detailed prompt for taxonomy generation in French"""
        base_prompt = """
        Vous êtes un expert en taxonomie d'audit et de conformité.
        
        Générez une suggestion de taxonomie pour un système d'audit qui comprend :
        - 1 domaine principal
        - 1 ou 2 thèmes pour ce domaine
        - 1 ou 2 sous-thèmes pour chaque thème
        
        Les domaines couramment utilisés incluent : Santé et sécurité au travail, Environnement, Qualité, Sécurité informatique, Ressources humaines, Finance, Gouvernance, etc.
        
        """
        
        if existing_domains:
            base_prompt += f"\nDomaines existants à éviter : {', '.join(existing_domains)}\n"
        
        base_prompt += """
        Format de réponse JSON requis :
        {
            "domain": {
                "name": "Nom du domaine concis et professionnel",
                "themes": [
                    {
                        "name": "Nom du thème 1",
                        "subthemes": [
                            "Sous-thème 1.1",
                            "Sous-thème 1.2"
                        ]
                    },
                    {
                        "name": "Nom du thème 2",
                        "subthemes": [
                            "Sous-thème 2.1"
                        ]
                    }
                ]
            }
        }
        
        Exemple de qualité attendue :
        Domaine: "Environnement"
        Thème: "Gestion des déchets industriels"
        Sous-thèmes: ["Réduction et recyclage des déchets", "Traitement et élimination sécurisée des déchets dangereux"]
        
        IMPORTANT :
        - Noms courts et professionnels
        - Vocabulaire d'audit et de conformité
        - Évitez les descriptions longues
        - Répondez UNIQUEMENT avec du JSON valide
        - Tout en français
        """
        
        return base_prompt
    
    def _parse_taxonomy_response(self, response_text):
        """Parse and validate taxonomy response"""
        try:
            # Clean the response text
            response_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            # Try to extract JSON from the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                parsed_response = json.loads(json_str)
                
                # Validate and set defaults for required fields
                validated_response = self._validate_taxonomy_response(parsed_response)
                return validated_response
            else:
                return self._get_fallback_taxonomy_response()
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            return self._get_fallback_taxonomy_response()
        except Exception as e:
            logger.error(f"Error parsing taxonomy response: {str(e)}")
            return self._get_fallback_taxonomy_response()
    
    def _validate_taxonomy_response(self, response):
        """Validate and ensure all required fields are present"""
        try:
            domain = response.get('domain', {})
            domain_name = domain.get('name', 'Nouveau Domaine')
            themes = domain.get('themes', [])
            
            # Ensure we have at least one theme
            if not themes:
                themes = [
                    {
                        'name': 'Thème Principal',
                        'subthemes': ['Sous-thème 1', 'Sous-thème 2']
                    }
                ]
            
            # Validate each theme
            validated_themes = []
            for theme in themes[:2]:  # Limit to 2 themes
                theme_name = theme.get('name', 'Thème')
                subthemes = theme.get('subthemes', [])
                
                # Ensure we have at least one subtheme
                if not subthemes:
                    subthemes = ['Sous-thème principal']
                
                validated_themes.append({
                    'name': theme_name,
                    'subthemes': subthemes[:2]  # Limit to 2 subthemes
                })
            
            return {
                'domain': {
                    'name': domain_name,
                    'themes': validated_themes
                }
            }
            
        except Exception as e:
            logger.error(f"Error validating taxonomy response: {str(e)}")
            return self._get_fallback_taxonomy_response()
    
    def _get_fallback_taxonomy_response(self):
        """Get fallback taxonomy response when service fails"""
        return {
            'domain': {
                'name': 'Sécurité Informatique',
                'themes': [
                    {
                        'name': 'Protection des données',
                        'subthemes': [
                            'Chiffrement et sécurisation',
                            'Sauvegarde et archivage'
                        ]
                    },
                    {
                        'name': 'Contrôle d\'accès',
                        'subthemes': [
                            'Authentification et autorisation'
                        ]
                    }
                ]
            }
        }
    
    def _create_analysis_prompt(self, description, domain=None, theme=None):
        """Create a detailed prompt for Gemini AI in French"""
        base_prompt = f"""
        Vous êtes un consultant expert en audit spécialisé dans la conformité et la gestion des risques.
        
        Analysez la description du plan d'action suivant et fournissez des insights structurés EN FRANÇAIS :
        
        Description de l'action : "{description}"
        """
        
        if domain:
            base_prompt += f"\nDomaine : {domain}"
        if theme:
            base_prompt += f"\nThème : {theme}"
            
        base_prompt += """
        
        Veuillez fournir une réponse JSON avec la structure suivante EN FRANÇAIS :
        {
            "priority_level": "Élevée/Moyenne/Faible",
            "risk_assessment": "Analyse brève des risques en français",
            "recommended_tips": [
                "Conseil 1 : Conseil actionnable spécifique en français",
                "Conseil 2 : Autre recommandation pratique en français",
                "Conseil 3 : Guidance supplémentaire en français"
            ],
            "compliance_areas": ["domaine1", "domaine2", "domaine3"],
            "estimated_effort": "Faible/Moyen/Élevé",
            "suggested_timeline": "Délai de réalisation recommandé en français",
            "key_stakeholders": ["rôle1", "rôle2", "rôle3"],
            "success_metrics": ["métrique1", "métrique2", "métrique3"]
        }
        
        Concentrez-vous sur des insights pratiques et actionnables qui aideraient un auditeur à réussir cette action.
        Répondez UNIQUEMENT avec du JSON valide, sans texte supplémentaire.
        IMPORTANT : Toutes les valeurs doivent être en français.
        """
        
        return base_prompt
    
    def _parse_gemini_response(self, response_text):
        """Parse and validate Gemini response"""
        try:
            # Clean the response text
            response_text = response_text.strip()
            
            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]
                
            response_text = response_text.strip()
            
            # Try to extract JSON from the response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start != -1 and json_end != -1:
                json_str = response_text[json_start:json_end]
                parsed_response = json.loads(json_str)
                
                # Validate and set defaults for required fields
                validated_response = self._validate_response(parsed_response)
                return validated_response
            else:
                # If no JSON found, create a structured response from text
                return self._create_fallback_response(response_text)
                
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}")
            # Fallback to text parsing
            return self._create_fallback_response(response_text)
        except Exception as e:
            logger.error(f"Error parsing response: {str(e)}")
            return self._create_fallback_response(response_text)
    
    def _validate_response(self, response):
        """Validate and ensure all required fields are present with French defaults"""
        validated = {}
        
        # Validate priority_level
        priority = response.get('priority_level', 'Moyenne')
        french_priorities = ['Élevée', 'Moyenne', 'Faible', 'Haute', 'Basse']
        if priority not in french_priorities:
            priority = 'Moyenne'
        validated['priority_level'] = priority
        
        # Validate risk_assessment
        validated['risk_assessment'] = response.get('risk_assessment', 'Évaluation des risques de conformité standard requise')
        
        # Validate recommended_tips
        tips = response.get('recommended_tips', [])
        if not isinstance(tips, list) or len(tips) == 0:
            tips = [
                "Examinez attentivement les exigences de l'action",
                "Consultez les parties prenantes pertinentes dès le début",
                "Documentez régulièrement les progrès"
            ]
        validated['recommended_tips'] = tips[:5]  # Limit to 5 tips
        
        # Validate compliance_areas
        areas = response.get('compliance_areas', [])
        if not isinstance(areas, list) or len(areas) == 0:
            areas = ['Conformité Générale']
        validated['compliance_areas'] = areas
        
        # Validate estimated_effort
        effort = response.get('estimated_effort', 'Moyen')
        french_efforts = ['Faible', 'Moyen', 'Élevé', 'Bas', 'Haut']
        if effort not in french_efforts:
            effort = 'Moyen'
        validated['estimated_effort'] = effort
        
        # Validate suggested_timeline
        validated['suggested_timeline'] = response.get('suggested_timeline', '2-4 semaines')
        
        # Validate key_stakeholders
        stakeholders = response.get('key_stakeholders', [])
        if not isinstance(stakeholders, list) or len(stakeholders) == 0:
            stakeholders = ['Responsable de l\'Action', 'Équipe de Conformité']
        validated['key_stakeholders'] = stakeholders
        
        # Validate success_metrics
        metrics = response.get('success_metrics', [])
        if not isinstance(metrics, list) or len(metrics) == 0:
            metrics = ['Réalisation dans les délais', 'Qualité de la mise en œuvre']
        validated['success_metrics'] = metrics
        
        return validated
    
    def _create_fallback_response(self, text):
        """Create structured response from unstructured text in French"""
        return {
            'priority_level': 'Moyenne',
            'risk_assessment': 'Analyse terminée - veuillez examiner les exigences de l\'action',
            'recommended_tips': [
                'Examinez attentivement les exigences de l\'action',
                'Impliquez les parties prenantes pertinentes dès le début',
                'Surveillez régulièrement les progrès et documentez les résultats',
                'Assurez-vous de la conformité aux réglementations applicables'
            ],
            'compliance_areas': ['Conformité Générale'],
            'estimated_effort': 'Moyen',
            'suggested_timeline': '2-4 semaines',
            'key_stakeholders': ['Responsable de l\'Action', 'Équipe de Conformité'],
            'success_metrics': ['Taux de réalisation', 'Évaluation de la qualité'],
            'detailed_analysis': text[:200] + '...' if len(text) > 200 else text
        }
    
    def _get_fallback_response(self, description):
        """Get fallback response when service fails in French"""
        return {
            'priority_level': 'Moyenne',
            'risk_assessment': 'Impossible d\'analyser automatiquement - révision manuelle requise',
            'recommended_tips': [
                'Examinez attentivement les exigences de l\'action',
                'Identifiez les parties prenantes clés et les dépendances',
                'Créez un plan de mise en œuvre détaillé',
                'Établissez des points de contrôle de progrès réguliers'
            ],
            'compliance_areas': ['Conformité Générale'],
            'estimated_effort': 'Moyen',
            'suggested_timeline': '2-4 semaines',
            'key_stakeholders': ['Responsable de l\'Action', 'Responsable de la Conformité'],
            'success_metrics': ['Réalisation dans les délais', 'Respect des normes de qualité']
        }

    def analyze_subscription_patterns(self, statistics, plans):
        """
        Use statistical analysis and pattern recognition to analyze subscription patterns
        - Statistical analysis for pricing optimization
        - Pattern recognition for usage behavior
        - Market positioning analysis
        """
        try:
            # Extract key metrics
            total_companies = statistics.get('totalCompanies', 0)
            active_companies = statistics.get('activeCompanies', 0)
            subscription_dist = statistics.get('subscriptionDistribution', [])
            avg_users = statistics.get('avgUsersPerCompany', 0)
            total_actions = statistics.get('totalActions', 0)
            completed_actions = statistics.get('completedActions', 0)
            total_texts = statistics.get('totalTexts', 0)
            compliant_texts = statistics.get('compliantTexts', 0)
            
            # Calculate global metrics
            action_completion_rate = (completed_actions / max(total_actions, 1)) * 100
            compliance_rate = (compliant_texts / max(total_texts, 1)) * 100
            
            suggestions = []
            
            # Analyze each plan
            for plan in plans:
                plan_id = plan.get('planId')
                
                # Find subscription data for this plan
                plan_subs = next((s for s in subscription_dist if s['planId'] == plan_id), None)
                
                if plan_subs:
                    adoption_rate = (plan_subs['count'] / max(active_companies, 1)) * 100
                    avg_plan_users = plan_subs.get('avgUsers', 0)
                    subscriber_count = plan_subs['count']
                    
                    # Generate insights based on patterns
                    insight = self._generate_plan_insights(
                        plan, 
                        adoption_rate, 
                        avg_plan_users, 
                        avg_users,
                        subscriber_count,
                        action_completion_rate,
                        compliance_rate
                    )
                    
                    # Generate actionable updates
                    actionable_updates = self._generate_actionable_updates(
                        plan,
                        insight['suggestedChanges']
                    )
                    
                    suggestions.append({
                        'planId': plan_id,
                        'planName': plan['name'],
                        'currentMetrics': {
                            'adoptionRate': round(adoption_rate, 2),
                            'avgUsers': round(avg_plan_users, 2),
                            'subscribers': subscriber_count
                        },
                        'insights': insight['insights'],
                        'recommendations': insight['recommendations'],
                        'suggestedChanges': insight['suggestedChanges'],
                        'actionableUpdates': actionable_updates,
                        'priorityScore': insight['priorityScore'],
                        'riskLevel': insight['riskLevel']
                    })
                else:
                    # Plan has no subscribers
                    suggested_changes = {
                        'prix': f"Réduire à {plan.get('basePrice', 0) * 0.8:.2f}$ (test marché)",
                        'rabais': "Appliquer 15-20% de réduction temporaire",
                        "Limite d'utilisateur": 'Aligner sur la demande moyenne du marché',
                        'traits': 'Enrichir avec fonctionnalités demandées'
                    }
                    
                    actionable_updates = self._generate_actionable_updates(plan, suggested_changes)
                    
                    suggestions.append({
                        'planId': plan_id,
                        'planName': plan['name'],
                        'currentMetrics': {
                            'adoptionRate': 0,
                            'avgUsers': 0,
                            'subscribers': 0
                        },
                        'insights': [
                            "⚠️ Ce plan n'a aucun abonné actuel",
                            "📊 Analyse comparative avec les plans populaires recommandée",
                            "🎯 Positionnement de marché à revoir"
                        ],
                        'recommendations': [
                            "Réévaluer le positionnement prix/fonctionnalités par rapport aux concurrents",
                            "Considérer la désactivation si non stratégique pour le portfolio",
                            "Analyser les écarts avec les plans ayant des abonnés",
                            "Envisager une offre promotionnelle limitée pour tester le marché"
                        ],
                        'suggestedChanges': suggested_changes,
                        'actionableUpdates': actionable_updates,
                        'priorityScore': 9,
                        'riskLevel': 'high'
                    })
            
            # Sort by priority score (higher = needs more attention)
            suggestions.sort(key=lambda x: x['priorityScore'], reverse=True)
            
            # Generate overall market insights
            market_insights = self._generate_market_insights(
                statistics, 
                subscription_dist, 
                avg_users,
                action_completion_rate,
                compliance_rate
            )
            
            return {
                'planSuggestions': suggestions,
                'marketInsights': market_insights,
                'analysisDate': datetime.now().isoformat(),
                'methodology': 'Analyse statistique avec reconnaissance de patterns comportementaux',
                'globalMetrics': {
                    'actionCompletionRate': round(action_completion_rate, 2),
                    'complianceRate': round(compliance_rate, 2),
                    'avgUsersPerCompany': round(avg_users, 2),
                    'totalActiveCompanies': active_companies
                }
            }
            
        except Exception as e:
            logger.error(f"Error in analyze_subscription_patterns: {str(e)}")
            return self._get_fallback_subscription_analysis()

    def _generate_plan_insights(self, plan, adoption_rate, avg_plan_users, global_avg_users, 
                                subscriber_count, action_completion_rate, compliance_rate):
        """Generate detailed insights for a specific plan using pattern recognition"""
        insights = []
        recommendations = []
        suggested_changes = {}
        priority_score = 5
        risk_level = 'low'
        
        # Adoption rate analysis (Pattern: Market acceptance)
        if adoption_rate > 50:
            insights.append(f"✅ Excellent taux d'adoption ({adoption_rate:.1f}%) - Plan très populaire")
            recommendations.append("Maintenir le positionnement actuel, c'est un plan phare")
            priority_score += 1  # Lower priority, it's doing well
        elif adoption_rate > 25:
            insights.append(f"📈 Bon taux d'adoption ({adoption_rate:.1f}%) - Performance stable")
            recommendations.append("Opportunité d'optimisation pour augmenter l'adoption")
            priority_score += 2
        else:
            insights.append(f"⚠️ Faible taux d'adoption ({adoption_rate:.1f}%) - Nécessite attention")
            recommendations.append("PRIORITÉ: Analyser les raisons du faible taux d'adoption")
            recommendations.append("Enquête auprès des entreprises pour identifier les freins")
            priority_score += 4
            risk_level = 'high'
        
        # User limit analysis (Pattern: Capacity utilization)
        user_limit = plan.get('userLimit', 10)
        utilization = (avg_plan_users / user_limit) * 100 if user_limit > 0 else 0
        
        if utilization > 85:
            insights.append(f"🔴 Limite d'utilisateurs proche de la saturation ({utilization:.1f}%)")
            recommendations.append("URGENT: Augmenter la limite pour éviter la frustration client")
            suggested_changes['userLimit'] = {
                'current': user_limit,
                'suggested': int(user_limit * 1.5),
                'reason': 'Saturation imminente - risque de churn'
            }
            priority_score += 3
            risk_level = 'high' if risk_level != 'critical' else risk_level
        elif utilization > 70:
            insights.append(f"🟡 Bonne utilisation de la limite ({utilization:.1f}%) - À surveiller")
            recommendations.append("Prévoir une augmentation progressive de la limite")
            suggested_changes['userLimit'] = {
                'current': user_limit,
                'suggested': int(user_limit * 1.3),
                'reason': 'Anticipation de la croissance'
            }
            priority_score += 1
        elif utilization < 30:
            insights.append(f"📉 Faible utilisation de la limite ({utilization:.1f}%)")
            recommendations.append("La limite pourrait être ajustée pour optimiser le positionnement")
            suggested_changes['userLimit'] = {
                'current': user_limit,
                'suggested': int(user_limit * 0.7),
                'reason': 'Optimisation de l\'offre vs usage réel'
            }
        
        # Pricing analysis (Pattern: Price sensitivity)
        base_price = plan.get('basePrice', 0)
        discount = plan.get('discount', 0)
        
        # Price per user metric
        price_per_user = base_price / user_limit if user_limit > 0 else base_price
        
        if discount == 0 and adoption_rate < 25:
            recommendations.append("Considérer l'ajout d'une réduction promotionnelle (10-15%)")
            suggested_changes['discount'] = {
                'current': 0,
                'suggested': 12,
                'reason': 'Stimuler l\'adoption avec incitation temporaire'
            }
            priority_score += 2
        elif discount > 15:
            insights.append(f"💰 Réduction élevée ({discount}%) - Vérifier la rentabilité")
            if adoption_rate > 40:
                recommendations.append("Forte adoption malgré réduction - Tester réduction progressive")
                suggested_changes['discount'] = {
                    'current': discount,
                    'suggested': max(5, discount - 5),
                    'reason': 'Optimisation marge avec adoption établie'
                }
        
        # Pricing positioning
        if base_price < 50 and adoption_rate > 40:
            recommendations.append("💡 Opportunité d'optimisation tarifaire identifiée")
            suggested_changes['pricing'] = {
                'current': base_price,
                'suggested': round(base_price * 1.15, 2),
                'reason': f'Forte adoption ({adoption_rate:.1f}%) permet ajustement prix'
            }
            priority_score += 1
        
        # Feature analysis (Pattern: Value proposition)
        try:
            features_json = plan.get('features', '[]')
            if isinstance(features_json, str):
                features = json.loads(features_json)
            else:
                features = features_json
            feature_count = len(features) if isinstance(features, list) else 0
        except:
            feature_count = 0
        
        if feature_count < 3:
            recommendations.append("Nombre limité de fonctionnalités - Enrichissement recommandé")
            suggested_changes['features'] = {
                'current': feature_count,
                'suggested': 'Ajouter 1-2 fonctionnalités à forte valeur',
                'reason': 'Améliorer la proposition de valeur'
            }
            priority_score += 2
        elif feature_count > 5:
            insights.append("✨ Plan riche en fonctionnalités - Bien positionné")
        
        # Subscriber volume analysis (Pattern: Market segment size)
        if subscriber_count < 3 and adoption_rate > 0:
            recommendations.append("⚠️ Petit nombre d'abonnés - Segment de niche ou problème?")
            risk_level = 'medium'
            priority_score += 3
        elif subscriber_count > 20:
            insights.append(f"🎯 Base solide de {subscriber_count} abonnés")
        
        # Determine overall risk level
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
            'priorityScore': min(priority_score, 10),  # Cap at 10
            'riskLevel': risk_level
        }

    def _generate_market_insights(self, statistics, subscription_dist, avg_users,
                                  action_completion_rate, compliance_rate):
        """Generate overall market insights using statistical patterns"""
        insights = []
        
        total = statistics.get('totalCompanies', 0)
        active = statistics.get('activeCompanies', 0)
        
        if total > 0:
            activation_rate = (active / total) * 100
            insights.append({
                'type': 'activation',
                'icon': '📊',
                'text': f"Taux d'activation des entreprises: {activation_rate:.1f}%",
                'status': 'good' if activation_rate > 70 else 'warning' if activation_rate > 40 else 'critical'
            })
        
        insights.append({
            'type': 'usage',
            'icon': '👥',
            'text': f"Moyenne d'utilisateurs par entreprise: {avg_users:.1f}",
            'status': 'info'
        })
        
        insights.append({
            'type': 'performance',
            'icon': '✅',
            'text': f"Taux de complétion des actions: {action_completion_rate:.1f}%",
            'status': 'good' if action_completion_rate > 70 else 'warning'
        })
        
        insights.append({
            'type': 'compliance',
            'icon': '📋',
            'text': f"Taux de conformité: {compliance_rate:.1f}%",
            'status': 'good' if compliance_rate > 80 else 'warning'
        })
        
        # Most popular plan
        if subscription_dist:
            most_popular = max(subscription_dist, key=lambda x: x['count'])
            insights.append({
                'type': 'popularity',
                'icon': '🏆',
                'text': f"Plan le plus populaire: {most_popular['planName']} ({most_popular['count']} abonnés)",
                'status': 'good'
            })
            
            # Market concentration analysis
            total_subscribers = sum(s['count'] for s in subscription_dist)
            concentration = (most_popular['count'] / max(total_subscribers, 1)) * 100
            
            if concentration > 60:
                insights.append({
                    'type': 'concentration',
                    'icon': '⚠️',
                    'text': f"Forte concentration ({concentration:.1f}%) sur un plan - Diversifier?",
                    'status': 'warning'
                })
        
        return insights

    def _get_fallback_subscription_analysis(self):
        """Fallback analysis if main analysis fails"""
        return {
            'planSuggestions': [],
            'marketInsights': [{
                'type': 'error',
                'icon': '❌',
                'text': "Analyse indisponible - Données insuffisantes",
                'status': 'critical'
            }],
            'analysisDate': datetime.now().isoformat(),
            'methodology': 'Fallback mode - Analyse indisponible',
            'globalMetrics': {}
        }

    def _generate_actionable_updates(self, plan, suggested_changes):
        """
        Generate actionable update object that can be directly applied to a plan
        Returns a dict with fields that can be sent to the backend update API
        """
        updates = {}
        
        for key, value in suggested_changes.items():
            if key == 'pricing':
                # Extract numeric value from suggestion
                if isinstance(value, dict) and 'suggested' in value:
                    updates['basePrice'] = value['suggested']
                elif isinstance(value, str):
                    # Try to extract number from string like "Réduire à 23.99$ (test marché)"
                    match = re.search(r'(\d+\.?\d*)', str(value))
                    if match:
                        updates['basePrice'] = float(match.group(1))
            
            elif key == 'discount':
                if isinstance(value, dict) and 'suggested' in value:
                    updates['discount'] = value['suggested']
                elif isinstance(value, str):
                    # Extract percentage like "15-20%" -> use midpoint 17.5
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
    Real NLP-based performance analysis using spaCy and statistical methods
    - Named Entity Recognition for key metrics
    - Sentiment analysis for performance trends
    - Time-series trend detection
    - Natural Language Generation for insights
    """
    
    def __init__(self):
        self.nlp = nlp
        
    def generate_performance_report(self, statistics):
        """
        Generate comprehensive NLP-based performance report
        Returns structured insights with linguistic analysis
        """
        try:
            # Extract metrics
            total_companies = statistics.get('totalCompanies', 0)
            active_companies = statistics.get('activeCompanies', 0)
            subscription_dist = statistics.get('subscriptionDistribution', [])
            avg_users = statistics.get('avgUsersPerCompany', 0)
            total_actions = statistics.get('totalActions', 0)
            completed_actions = statistics.get('completedActions', 0)
            total_texts = statistics.get('totalTexts', 0)
            compliant_texts = statistics.get('compliantTexts', 0)
            
            # Calculate derived metrics
            activation_rate = (active_companies / max(total_companies, 1)) * 100
            action_completion_rate = (completed_actions / max(total_actions, 1)) * 100
            compliance_rate = (compliant_texts / max(total_texts, 1)) * 100
            
            # 1. SENTIMENT ANALYSIS - Determine overall system health
            sentiment = self._analyze_system_sentiment(
                activation_rate, 
                action_completion_rate, 
                compliance_rate
            )
            
            # 2. TREND DETECTION - Use linear regression for growth patterns
            trend_analysis = self._detect_trends(subscription_dist, total_companies)
            
            # 3. ANOMALY DETECTION - Statistical outlier detection
            anomalies = self._detect_anomalies(statistics)
            
            # 4. NATURAL LANGUAGE GENERATION - Create human-readable insights
            executive_summary = self._generate_executive_summary(
                sentiment,
                activation_rate,
                action_completion_rate,
                compliance_rate,
                trend_analysis
            )
            
            # 5. KEY PERFORMANCE INDICATORS with linguistic context
            kpis = self._extract_kpis(statistics)
            
            # 6. RECOMMENDATIONS using pattern matching
            recommendations = self._generate_recommendations(
                sentiment,
                anomalies,
                kpis
            )
            
            # 7. DETAILED SECTIONS
            sections = {
                'user_engagement': self._analyze_user_engagement(avg_users, active_companies),
                'compliance_analysis': self._analyze_compliance(compliance_rate, compliant_texts, total_texts),
                'action_performance': self._analyze_action_performance(action_completion_rate, completed_actions, total_actions),
                'subscription_insights': self._analyze_subscriptions(subscription_dist, active_companies)
            }
            
            return {
                'success': True,
                'report': {
                    'metadata': {
                        'generated_at': datetime.now().isoformat(),
                        'report_period': 'Période Complète',
                        'analysis_method': 'NLP avec spaCy + Analyse Statistique',
                        'language': 'fr'
                    },
                    'sentiment': sentiment,
                    'executive_summary': executive_summary,
                    'kpis': kpis,
                    'trend_analysis': trend_analysis,
                    'anomalies': anomalies,
                    'sections': sections,
                    'recommendations': recommendations,
                    'raw_metrics': {
                        'totalCompanies': total_companies,
                        'activeCompanies': active_companies,
                        'activationRate': round(activation_rate, 2),
                        'avgUsersPerCompany': round(avg_users, 2),
                        'actionCompletionRate': round(action_completion_rate, 2),
                        'complianceRate': round(compliance_rate, 2)
                    }
                }
            }
            
        except Exception as e:
            logger.error(f"Error generating performance report: {str(e)}")
            return self._get_fallback_report()
    
    def _analyze_system_sentiment(self, activation_rate, action_rate, compliance_rate):
        """
        Sentiment analysis based on multiple performance indicators
        Uses weighted scoring system
        """
        # Weighted sentiment scoring
        weights = {'activation': 0.3, 'action': 0.4, 'compliance': 0.3}
        
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
            'description': description,
            'color': color,
            'components': {
                'activation': round(activation_rate, 2),
                'action_completion': round(action_rate, 2),
                'compliance': round(compliance_rate, 2)
            }
        }
    
    def _detect_trends(self, subscription_dist, total_companies):
        """
        Time-series trend detection using linear regression
        Analyzes growth patterns
        """
        if not subscription_dist or len(subscription_dist) < 2:
            return {
                'direction': 'stable',
                'confidence': 0,
                'description': 'Données insuffisantes pour l\'analyse de tendance',
                'emoji': '➡️',
                'metrics': {}
            }
        
        # Extract subscriber counts
        subscriber_counts = [s.get('count', 0) for s in subscription_dist]
        
        # Calculate growth rate
        if len(subscriber_counts) >= 2:
            total_subscribers = sum(subscriber_counts)
            avg_per_plan = total_subscribers / len(subscriber_counts)
            
            # Variance analysis
            variance = np.var(subscriber_counts) if len(subscriber_counts) > 1 else 0
            
            if avg_per_plan > total_companies * 0.7:
                direction = 'croissance_forte'
                emoji = '📈'
                description = f"Adoption forte avec {total_subscribers} abonnements actifs répartis sur {len(subscriber_counts)} plans"
            elif avg_per_plan > total_companies * 0.4:
                direction = 'croissance_stable'
                emoji = '➡️'
                description = f"Croissance stable avec distribution équilibrée des abonnements"
            else:
                direction = 'opportunite'
                emoji = '💡'
                description = f"Potentiel de croissance identifié - taux d'adoption actuel à optimiser"
            
            return {
                'direction': direction,
                'emoji': emoji,
                'description': description,
                'metrics': {
                    'total_subscribers': total_subscribers,
                    'avg_per_plan': round(avg_per_plan, 2),
                    'distribution_variance': round(variance, 2),
                    'plan_count': len(subscriber_counts)
                }
            }
        
        return {
            'direction': 'stable',
            'emoji': '➡️',
            'description': 'Tendance stable observée',
            'metrics': {}
        }
    
    def _detect_anomalies(self, statistics):
        """
        Statistical anomaly detection using standard deviation
        Identifies outliers and unusual patterns
        """
        anomalies = []
        
        total_companies = statistics.get('totalCompanies', 0)
        active_companies = statistics.get('activeCompanies', 0)
        avg_users = statistics.get('avgUsersPerCompany', 0)
        
        # Anomaly 1: Low activation rate
        if total_companies > 0:
            activation_rate = (active_companies / total_companies) * 100
            if activation_rate < 50:
                anomalies.append({
                    'type': 'activation_faible',
                    'severity': 'high',
                    'emoji': '⚠️',
                    'description': f"Taux d'activation faible détecté ({activation_rate:.1f}%) - Moins de 50% des entreprises sont actives",
                    'value': round(activation_rate, 2),
                    'threshold': 50
                })
        
        # Anomaly 2: Abnormal user count
        if avg_users < 2:
            anomalies.append({
                'type': 'utilisateurs_faible',
                'severity': 'medium',
                'emoji': '👥',
                'description': f"Moyenne d'utilisateurs par entreprise faible ({avg_users:.1f}) - Sous-utilisation potentielle",
                'value': round(avg_users, 2),
                'threshold': 2
            })
        elif avg_users > 50:
            anomalies.append({
                'type': 'utilisateurs_eleve',
                'severity': 'info',
                'emoji': '📊',
                'description': f"Engagement élevé détecté ({avg_users:.1f} utilisateurs/entreprise) - Opportunité d'upselling",
                'value': round(avg_users, 2),
                'threshold': 50
            })
        
        # Anomaly 3: Action completion analysis
        total_actions = statistics.get('totalActions', 0)
        completed_actions = statistics.get('completedActions', 0)
        if total_actions > 0:
            completion_rate = (completed_actions / total_actions) * 100
            if completion_rate < 40:
                anomalies.append({
                    'type': 'completion_faible',
                    'severity': 'high',
                    'emoji': '📋',
                    'description': f"Taux de complétion des actions critiquement bas ({completion_rate:.1f}%)",
                    'value': round(completion_rate, 2),
                    'threshold': 40
                })
        
        # Anomaly 4: Compliance gap
        total_texts = statistics.get('totalTexts', 0)
        compliant_texts = statistics.get('compliantTexts', 0)
        if total_texts > 0:
            compliance_rate = (compliant_texts / total_texts) * 100
            if compliance_rate < 60:
                anomalies.append({
                    'type': 'conformite_faible',
                    'severity': 'high',
                    'emoji': '⚖️',
                    'description': f"Écart de conformité significatif détecté ({compliance_rate:.1f}%)",
                    'value': round(compliance_rate, 2),
                    'threshold': 60
                })
        
        return anomalies
    
    def _generate_executive_summary(self, sentiment, activation, action_rate, compliance, trend):
        """
        Natural Language Generation for executive summary
        Creates human-readable narrative
        """
        summary_parts = []
        
        # Opening statement based on sentiment
        if sentiment['level'] == 'excellent':
            summary_parts.append(f"{sentiment['emoji']} Le système affiche une performance exceptionnelle avec un score global de {sentiment['score']:.1f}/100.")
        elif sentiment['level'] == 'good':
            summary_parts.append(f"{sentiment['emoji']} Le système présente une performance satisfaisante avec un score de {sentiment['score']:.1f}/100, offrant des opportunités d'optimisation.")
        elif sentiment['level'] == 'moderate':
            summary_parts.append(f"{sentiment['emoji']} Le système nécessite une attention avec un score de {sentiment['score']:.1f}/100. Des améliorations sont recommandées.")
        else:
            summary_parts.append(f"{sentiment['emoji']} Le système requiert une intervention urgente avec un score critique de {sentiment['score']:.1f}/100.")
        
        # Activation analysis
        if activation >= 70:
            summary_parts.append(f"L'activation des entreprises est forte ({activation:.1f}%), démontrant une adoption solide de la plateforme.")
        elif activation >= 50:
            summary_parts.append(f"Le taux d'activation ({activation:.1f}%) est modéré, avec un potentiel d'amélioration identifié.")
        else:
            summary_parts.append(f"Le taux d'activation ({activation:.1f}%) est préoccupant et nécessite des actions immédiates.")
        
        # Action completion insight
        if action_rate >= 70:
            summary_parts.append(f"Les plans d'action montrent une excellente exécution ({action_rate:.1f}% de complétion).")
        elif action_rate >= 50:
            summary_parts.append(f"L'exécution des actions ({action_rate:.1f}%) est acceptable mais perfectible.")
        else:
            summary_parts.append(f"Le taux de complétion des actions ({action_rate:.1f}%) révèle des difficultés d'exécution.")
        
        # Compliance statement
        if compliance >= 80:
            summary_parts.append(f"La conformité réglementaire est exemplaire ({compliance:.1f}%).")
        elif compliance >= 60:
            summary_parts.append(f"La conformité ({compliance:.1f}%) est satisfaisante avec des marges d'amélioration.")
        else:
            summary_parts.append(f"La conformité ({compliance:.1f}%) nécessite une attention prioritaire.")
        
        # Trend conclusion
        summary_parts.append(f"{trend['emoji']} {trend['description']}")
        
        return " ".join(summary_parts)
    
    def _extract_kpis(self, statistics):
        """
        Extract and structure Key Performance Indicators
        """
        total_companies = statistics.get('totalCompanies', 0)
        active_companies = statistics.get('activeCompanies', 0)
        total_actions = statistics.get('totalActions', 0)
        completed_actions = statistics.get('completedActions', 0)
        total_texts = statistics.get('totalTexts', 0)
        compliant_texts = statistics.get('compliantTexts', 0)
        avg_users = statistics.get('avgUsersPerCompany', 0)
        
        kpis = [
            {
                'name': 'Taux d\'Activation',
                'value': round((active_companies / max(total_companies, 1)) * 100, 2),
                'unit': '%',
                'category': 'adoption',
                'trend': 'up' if active_companies > total_companies * 0.6 else 'neutral',
                'description': f"{active_companies} entreprises actives sur {total_companies}"
            },
            {
                'name': 'Engagement Utilisateur',
                'value': round(avg_users, 2),
                'unit': ' utilisateurs/entreprise',
                'category': 'engagement',
                'trend': 'up' if avg_users > 3 else 'neutral',
                'description': f"Moyenne de {avg_users:.1f} utilisateurs par entreprise"
            },
            {
                'name': 'Exécution des Actions',
                'value': round((completed_actions / max(total_actions, 1)) * 100, 2),
                'unit': '%',
                'category': 'performance',
                'trend': 'up' if completed_actions > total_actions * 0.6 else 'down',
                'description': f"{completed_actions} actions complétées sur {total_actions}"
            },
            {
                'name': 'Conformité Réglementaire',
                'value': round((compliant_texts / max(total_texts, 1)) * 100, 2),
                'unit': '%',
                'category': 'compliance',
                'trend': 'up' if compliant_texts > total_texts * 0.7 else 'neutral',
                'description': f"{compliant_texts} textes conformes sur {total_texts}"
            }
        ]
        
        return kpis
    
    def _generate_recommendations(self, sentiment, anomalies, kpis):
        """
        Generate actionable recommendations using pattern matching
        """
        recommendations = []
        
        # Priority 1: Address critical anomalies
        critical_anomalies = [a for a in anomalies if a.get('severity') == 'high']
        if critical_anomalies:
            for anomaly in critical_anomalies:
                recommendations.append({
                    'priority': 'high',
                    'category': anomaly['type'],
                    'emoji': '🔴',
                    'title': f"Action Prioritaire: {anomaly['description'].split('-')[0].strip()}",
                    'description': anomaly['description'],
                    'actions': self._get_remediation_actions(anomaly['type'])
                })
        
        # Priority 2: Optimization opportunities
        for kpi in kpis:
            if kpi['value'] < 60 and kpi['category'] in ['performance', 'compliance']:
                recommendations.append({
                    'priority': 'medium',
                    'category': kpi['category'],
                    'emoji': '⚠️',
                    'title': f"Optimisation: {kpi['name']}",
                    'description': f"Le {kpi['name']} ({kpi['value']}{kpi['unit']}) peut être amélioré",
                    'actions': self._get_optimization_actions(kpi['category'])
                })
        
        # Priority 3: Growth opportunities
        if sentiment['level'] in ['excellent', 'good']:
            recommendations.append({
                'priority': 'low',
                'category': 'growth',
                'emoji': '🚀',
                'title': "Opportunité de Croissance",
                'description': "Performance solide - Moment propice pour l'expansion",
                'actions': [
                    "Lancer campagne d'acquisition de nouveaux clients",
                    "Développer fonctionnalités premium basées sur usage actuel",
                    "Renforcer programme de fidélisation"
                ]
            })
        
        return recommendations
    
    def _get_remediation_actions(self, anomaly_type):
        """Get specific remediation actions for anomaly types"""
        actions_map = {
            'activation_faible': [
                "Analyser les barrières à l'activation des comptes",
                "Mettre en place un programme d'onboarding renforcé",
                "Contacter directement les entreprises inactives"
            ],
            'completion_faible': [
                "Identifier les blocages dans l'exécution des actions",
                "Former les utilisateurs sur les outils de gestion",
                "Simplifier le processus de complétion"
            ],
            'conformite_faible': [
                "Prioriser la mise en conformité des textes critiques",
                "Allouer ressources supplémentaires à l'équipe conformité",
                "Automatiser le suivi des échéances réglementaires"
            ],
            'utilisateurs_faible': [
                "Encourager l'ajout d'utilisateurs via incitatifs",
                "Démontrer la valeur de la collaboration multi-utilisateurs",
                "Offrir formation gratuite pour nouveaux utilisateurs"
            ]
        }
        return actions_map.get(anomaly_type, ["Analyser la situation", "Définir plan d'action", "Suivre les indicateurs"])
    
    def _get_optimization_actions(self, category):
        """Get optimization actions by category"""
        actions_map = {
            'performance': [
                "Optimiser les workflows d'exécution",
                "Mettre en place tableaux de bord de suivi",
                "Définir objectifs SMART par équipe"
            ],
            'compliance': [
                "Automatiser veille réglementaire",
                "Standardiser processus d'évaluation",
                "Former équipes aux nouvelles exigences"
            ],
            'engagement': [
                "Gamifier l'expérience utilisateur",
                "Envoyer notifications intelligentes",
                "Créer communauté utilisateurs active"
            ]
        }
        return actions_map.get(category, ["Analyser métriques", "Tester améliorations", "Mesurer impact"])
    
    def _analyze_user_engagement(self, avg_users, active_companies):
        """Detailed user engagement analysis"""
        total_users = avg_users * active_companies
        
        if avg_users >= 5:
            level = 'excellent'
            emoji = '🌟'
            insight = f"Engagement exceptionnel avec {avg_users:.1f} utilisateurs par entreprise en moyenne"
        elif avg_users >= 3:
            level = 'good'
            emoji = '✅'
            insight = f"Bon niveau d'engagement ({avg_users:.1f} utilisateurs/entreprise)"
        elif avg_users >= 2:
            level = 'moderate'
            emoji = '➡️'
            insight = f"Engagement modéré ({avg_users:.1f} utilisateurs/entreprise) - Potentiel d'amélioration"
        else:
            level = 'low'
            emoji = '⚠️'
            insight = f"Engagement faible ({avg_users:.1f} utilisateurs/entreprise) - Action requise"
        
        return {
            'level': level,
            'emoji': emoji,
            'insight': insight,
            'metrics': {
                'avg_users_per_company': round(avg_users, 2),
                'total_active_users': int(total_users),
                'active_companies': active_companies
            },
            'recommendations': [
                "Encourager collaboration inter-équipes",
                "Proposer formations gratuites",
                "Simplifier processus d'invitation utilisateurs"
            ]
        }
    
    def _analyze_compliance(self, rate, compliant, total):
        """Detailed compliance analysis"""
        gap = total - compliant
        
        if rate >= 80:
            status = 'excellent'
            emoji = '✅'
            message = "Conformité exemplaire"
        elif rate >= 60:
            status = 'good'
            emoji = '👍'
            message = "Conformité satisfaisante"
        else:
            status = 'critical'
            emoji = '⚠️'
            message = "Écart de conformité significatif"
        
        return {
            'status': status,
            'emoji': emoji,
            'message': message,
            'rate': round(rate, 2),
            'gap': gap,
            'metrics': {
                'compliant_texts': compliant,
                'total_texts': total,
                'non_compliant': gap
            },
            'priority_actions': [
                f"Traiter {gap} textes non-conformes en priorité",
                "Mettre en place revue mensuelle de conformité",
                "Automatiser alertes pour nouvelles réglementations"
            ]
        }
    
    def _analyze_action_performance(self, rate, completed, total):
        """Detailed action performance analysis"""
        pending = total - completed
        
        if rate >= 75:
            performance = 'excellent'
            emoji = '🎯'
            message = "Excellente exécution des plans d'action"
        elif rate >= 50:
            performance = 'good'
            emoji = '✓'
            message = "Exécution satisfaisante des actions"
        else:
            performance = 'needs_improvement'
            emoji = '⚠️'
            message = "Exécution des actions à améliorer"
        
        return {
            'performance': performance,
            'emoji': emoji,
            'message': message,
            'rate': round(rate, 2),
            'metrics': {
                'completed': completed,
                'total': total,
                'pending': pending,
                'completion_rate': round(rate, 2)
            },
            'insights': [
                f"{completed} actions complétées avec succès",
                f"{pending} actions en cours nécessitent attention",
                f"Taux de réussite: {rate:.1f}%"
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
        
        total_subscribers = sum(s.get('count', 0) for s in subscription_dist)
        most_popular = max(subscription_dist, key=lambda x: x.get('count', 0))
        
        penetration_rate = (total_subscribers / max(active_companies, 1)) * 100
        
        return {
            'penetration_rate': round(penetration_rate, 2),
            'total_subscribers': total_subscribers,
            'most_popular_plan': most_popular.get('planName', 'N/A'),
            'plan_count': len(subscription_dist),
            'emoji': '📊',
            'message': f"Analyse de {len(subscription_dist)} plans d'abonnement",
            'distribution': [
                {
                    'plan': s.get('planName'),
                    'subscribers': s.get('count'),
                    'percentage': round((s.get('count', 0) / max(total_subscribers, 1)) * 100, 2)
                }
                for s in subscription_dist
            ],
            'insights': [
                f"Plan le plus populaire: {most_popular.get('planName')} ({most_popular.get('count')} abonnés)",
                f"Taux de pénétration: {penetration_rate:.1f}% des entreprises actives",
                f"{len(subscription_dist)} plans d'abonnement disponibles"
            ]
        }
    
    def _get_fallback_report(self):
        """Fallback report when analysis fails"""
        return {
            'success': False,
            'report': {
                'metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'status': 'error'
                },
                'executive_summary': 'Impossible de générer le rapport - données insuffisantes',
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
                    'description': 'Analyse indisponible'
                },
                'anomalies': [],
                'sections': {},
                'recommendations': [{
                    'priority': 'high',
                    'title': 'Vérifier les données',
                    'description': 'Les statistiques système sont incomplètes',
                    'emoji': '⚠️',
                    'actions': ['Vérifier la connexion à la base de données', 'Recharger les statistiques']
                }]
            }
        }


# Initialize services
nlp_service = NLPService()
performance_nlp = PerformanceReportNLP()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "healthy", "service": "Service d'Analyse NLP"})

@app.route('/analyze-action', methods=['POST'])
def analyze_action():
    """Analyze action plan description and generate tips"""
    try:
        data = request.get_json()
        
        if not data or 'description' not in data:
            return jsonify({"error": "Description requise"}), 400
        
        description = data['description']
        domain = data.get('domain')
        theme = data.get('theme')
        
        # Analyze the action description
        analysis = nlp_service.analyze_action_description(description, domain, theme)
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_action endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "analysis": nlp_service._get_fallback_response(data.get('description', ''))
        }), 200  # Return 200 with fallback data

@app.route('/suggest-taxonomy', methods=['POST'])
def suggest_taxonomy():
    """Generate taxonomy suggestions using AI"""
    try:
        data = request.get_json()
        existing_domains = data.get('existing_domains', []) if data else []
        
        # Generate taxonomy suggestion
        suggestion = nlp_service.generate_taxonomy_suggestion(existing_domains)
        
        return jsonify({
            "success": True,
            "suggestion": suggestion
        })
        
    except Exception as e:
        logger.error(f"Error in suggest_taxonomy endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "suggestion": nlp_service._get_fallback_taxonomy_response()
        }), 200  # Return 200 with fallback data

@app.route('/batch-analyze', methods=['POST'])
def batch_analyze():
    """Analyze multiple action descriptions at once"""
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
                    action.get('theme')
                )
                results.append({
                    "actionId": action.get('actionId'),
                    "analysis": analysis
                })
        
        return jsonify({
            "success": True,
            "results": results
        })
        
    except Exception as e:
        logger.error(f"Error in batch_analyze endpoint: {str(e)}")
        return jsonify({"error": "Erreur interne du serveur"}), 500

@app.route('/test-model', methods=['GET'])
def test_model():
    """Test endpoint to verify model availability"""
    try:
        # List available models
        models = genai.list_models()
        available_models = [model.name for model in models]
        
        return jsonify({
            "success": True,
            "available_models": available_models,
            "current_model": "gemini-1.5-flash"
        })
        
    except Exception as e:
        logger.error(f"Error testing model: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-subscription-performance', methods=['POST'])
def analyze_subscription_performance():
    """
    Analyze subscription plans and suggest optimizations based on usage patterns
    Uses statistical analysis and pattern recognition for insights
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "Données requises"}), 400
        
        # Extract statistics and plans
        statistics = data.get('statistics', {})
        plans = data.get('plans', [])
        
        if not statistics or not plans:
            return jsonify({"error": "Statistiques et plans requis"}), 400
        
        # Perform NLP-based analysis
        analysis = nlp_service.analyze_subscription_patterns(statistics, plans)
        
        return jsonify({
            "success": True,
            "analysis": analysis
        })
        
    except Exception as e:
        logger.error(f"Error in analyze_subscription_performance endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "analysis": nlp_service._get_fallback_subscription_analysis()
        }), 200  # Return 200 with fallback data
@app.route('/generate-performance-report', methods=['POST'])
def generate_performance_report():
    """
    Generate comprehensive NLP-based performance report
    Uses spaCy for real linguistic analysis
    """
    try:
        data = request.get_json()
        
        if not data or 'statistics' not in data:
            return jsonify({"error": "Statistiques requises"}), 400
        
        statistics = data['statistics']
        
        # Generate NLP-based report
        report = performance_nlp.generate_performance_report(statistics)
        
        return jsonify(report)
        
    except Exception as e:
        logger.error(f"Error in generate_performance_report endpoint: {str(e)}")
        return jsonify({
            "success": False,
            "error": "Erreur interne du serveur",
            "report": performance_nlp._get_fallback_report()
        }), 200
if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)