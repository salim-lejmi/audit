from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import os
from dotenv import load_dotenv
import logging
import json
from datetime import datetime
import re

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
                        'pricing': f"Réduire à {plan.get('basePrice', 0) * 0.8:.2f}$ (test marché)",
                        'discount': "Appliquer 15-20% de réduction temporaire",
                        'userLimit': 'Aligner sur la demande moyenne du marché',
                        'features': 'Enrichir avec fonctionnalités demandées'
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

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)