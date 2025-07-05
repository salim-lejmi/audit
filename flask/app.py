from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
import json

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app, origins=["http://localhost:5173"])  # Allow React app to connect

# Configure Gemini AI
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

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

# Initialize NLP service
nlp_service = NLPService()

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

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)