// Learning Journey Service
// Coordinates AI-powered lessons with user progress and game recommendations

import { SteddieAIService, UserProgress, LearningSession } from './SteddieAIService';
import { progressService } from './progressService';
import { leaderboardService } from './LeaderboardService';

export interface LearningPath {
  id: string;
  name: string;
  description: string;
  techniques: string[];
  recommendedGames: string[];
  estimatedDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface LearningRecommendation {
  type: 'lesson' | 'practice' | 'game' | 'review';
  title: string;
  description: string;
  technique?: string;
  gameType?: string;
  culturalContext?: string;
  difficulty?: string;
  estimatedTime: string;
  aiGenerated: boolean;
}

export class LearningJourneyService {
  private steddieAI: SteddieAIService;
  private userSessions: Map<string, LearningSession[]> = new Map();

  constructor() {
    this.steddieAI = new SteddieAIService({
      provider: 'venice',
      model: 'llama-3.3-70b',
      fallbackToRules: true
    });
  }

  // Predefined learning paths
  private learningPaths: LearningPath[] = [
    {
      id: 'memory_foundations',
      name: 'Memory Foundations',
      description: 'Start your memory journey with essential techniques',
      techniques: ['observation', 'chunking', 'linking'],
      recommendedGames: ['chaos_cards', 'speed_challenge'],
      estimatedDuration: '2-3 weeks',
      difficulty: 'beginner'
    },
    {
      id: 'spatial_mastery',
      name: 'Spatial Memory Mastery',
      description: 'Master the ancient art of memory palaces',
      techniques: ['loci', 'journey', 'spatial'],
      recommendedGames: ['memory_palace'],
      estimatedDuration: '3-4 weeks',
      difficulty: 'intermediate'
    },
    {
      id: 'number_systems',
      name: 'Number Memory Systems',
      description: 'Learn advanced number memorization techniques',
      techniques: ['major_system', 'peg_system'],
      recommendedGames: ['speed_challenge'],
      estimatedDuration: '4-5 weeks',
      difficulty: 'advanced'
    },
    {
      id: 'cultural_explorer',
      name: 'Cultural Memory Explorer',
      description: 'Explore memory techniques from different cultures',
      techniques: ['cultural', 'story', 'linking'],
      recommendedGames: ['chaos_cards', 'memory_palace'],
      estimatedDuration: '3-4 weeks',
      difficulty: 'intermediate'
    }
  ];

  // Get user's current progress and convert to UserProgress format
  async getUserProgress(userId: string): Promise<UserProgress> {
    const stats = await progressService.getUserStats(userId);
    const achievements = await progressService.getUserAchievements(userId);
    
    if (!stats) {
      return {
        level: 1,
        gamesPlayed: 0,
        totalScore: 0,
        averageAccuracy: 0,
        strongTechniques: [],
        weakTechniques: [],
        recentPerformance: [],
        achievements: [],
        currentStreak: 0,
        culturalPreferences: []
      };
    }

    // Analyze technique performance from recent games
    const recentSessions = await progressService.getRecentSessions(userId, 10);
    const techniquePerformance = this.analyzeTechniquePerformance(recentSessions);

    return {
      level: Math.floor(stats.total_sessions / 10) + 1,
      gamesPlayed: stats.total_sessions,
      totalScore: stats.average_score * stats.total_sessions, // Calculate total from average
      averageAccuracy: stats.average_accuracy,
      strongTechniques: techniquePerformance.strong,
      weakTechniques: techniquePerformance.weak,
      recentPerformance: recentSessions.slice(0, 5).map(s => s.accuracy),
      achievements: achievements.map(a => a.achievement_name),
      currentStreak: stats.current_streak,
      culturalPreferences: this.extractCulturalPreferences(recentSessions)
    };
  }

  // Analyze which techniques user performs well/poorly with
  private analyzeTechniquePerformance(sessions: any[]): { strong: string[], weak: string[] } {
    const techniqueStats: { [key: string]: { total: number, correct: number } } = {};
    
    sessions.forEach(session => {
      const technique = session.metadata?.technique || 'observation';
      if (!techniqueStats[technique]) {
        techniqueStats[technique] = { total: 0, correct: 0 };
      }
      techniqueStats[technique].total++;
      if (session.accuracy >= 80) {
        techniqueStats[technique].correct++;
      }
    });

    const strong: string[] = [];
    const weak: string[] = [];

    Object.entries(techniqueStats).forEach(([technique, stats]) => {
      if (stats.total >= 3) { // Only consider techniques with enough data
        const accuracy = stats.correct / stats.total;
        if (accuracy >= 0.8) {
          strong.push(technique);
        } else if (accuracy < 0.6) {
          weak.push(technique);
        }
      }
    });

    return { strong, weak };
  }

  // Extract cultural preferences from game history
  private extractCulturalPreferences(sessions: any[]): string[] {
    const cultureCounts: { [key: string]: number } = {};
    
    sessions.forEach(session => {
      const culture = session.metadata?.culture || 'randomness-revolution';
      cultureCounts[culture] = (cultureCounts[culture] || 0) + 1;
    });

    return Object.entries(cultureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([culture]) => culture);
  }

  // Get personalized learning recommendations
  async getRecommendations(userId: string): Promise<LearningRecommendation[]> {
    const userProgress = await this.getUserProgress(userId);
    const recommendations: LearningRecommendation[] = [];

    // AI-generated personalized recommendation
    try {
      const aiRecommendation = await this.steddieAI.getPersonalizedRecommendation(userProgress);
      recommendations.push({
        type: 'lesson',
        title: 'Steddie\'s Personal Recommendation',
        description: aiRecommendation,
        estimatedTime: '5-10 minutes',
        aiGenerated: true
      });
    } catch (error) {
      console.error('Failed to get AI recommendation:', error);
    }

    // Rule-based recommendations
    if (userProgress.gamesPlayed === 0) {
      recommendations.push({
        type: 'lesson',
        title: 'Welcome to Memory Training!',
        description: 'Start with the basics of observation and attention',
        technique: 'observation',
        gameType: 'chaos_cards',
        difficulty: 'easy',
        estimatedTime: '10 minutes',
        aiGenerated: false
      });
    } else if (userProgress.weakTechniques.length > 0) {
      const weakTechnique = userProgress.weakTechniques[0];
      recommendations.push({
        type: 'practice',
        title: `Improve Your ${weakTechnique} Technique`,
        description: `Focus on strengthening your ${weakTechnique} skills`,
        technique: weakTechnique,
        gameType: this.getBestGameForTechnique(weakTechnique),
        difficulty: 'medium',
        estimatedTime: '15 minutes',
        aiGenerated: false
      });
    }

    // Suggest next technique to learn
    if (userProgress.strongTechniques.length >= 2) {
      const nextTechnique = this.suggestNextTechnique(userProgress);
      if (nextTechnique) {
        recommendations.push({
          type: 'lesson',
          title: `Learn ${nextTechnique}`,
          description: `Ready to master a new technique? Try ${nextTechnique}`,
          technique: nextTechnique,
          gameType: this.getBestGameForTechnique(nextTechnique),
          difficulty: 'medium',
          estimatedTime: '20 minutes',
          aiGenerated: false
        });
      }
    }

    return recommendations;
  }

  // Get best game for practicing a specific technique
  private getBestGameForTechnique(technique: string): string {
    const gameMapping: { [key: string]: string } = {
      'major_system': 'speed_challenge',
      'peg_system': 'speed_challenge',
      'chunking': 'speed_challenge',
      'loci': 'memory_palace',
      'journey': 'memory_palace',
      'spatial': 'memory_palace',
      'linking': 'chaos_cards',
      'observation': 'chaos_cards',
      'cultural': 'chaos_cards',
      'story': 'chaos_cards'
    };
    
    return gameMapping[technique] || 'chaos_cards';
  }

  // Suggest next technique to learn based on progress
  private suggestNextTechnique(userProgress: UserProgress): string | null {
    const allTechniques = ['observation', 'chunking', 'linking', 'loci', 'major_system', 'peg_system', 'cultural', 'journey', 'spatial', 'story'];
    const knownTechniques = [...userProgress.strongTechniques, ...userProgress.weakTechniques];
    const unknownTechniques = allTechniques.filter(t => !knownTechniques.includes(t));
    
    if (unknownTechniques.length === 0) return null;
    
    // Suggest based on user's level and preferences
    if (userProgress.level <= 2) {
      return unknownTechniques.find(t => ['chunking', 'linking', 'cultural'].includes(t)) || unknownTechniques[0];
    } else if (userProgress.level <= 4) {
      return unknownTechniques.find(t => ['loci', 'journey', 'story'].includes(t)) || unknownTechniques[0];
    } else {
      return unknownTechniques.find(t => ['major_system', 'peg_system', 'spatial'].includes(t)) || unknownTechniques[0];
    }
  }

  // Generate AI lesson for specific technique
  async generateLesson(technique: string, userLevel: 'beginner' | 'intermediate' | 'advanced'): Promise<string> {
    return await this.steddieAI.generateLesson(technique, userLevel);
  }

  // Analyze game performance with AI
  async analyzePerformance(
    userId: string,
    gameType: string,
    score: number,
    accuracy: number,
    technique: string
  ): Promise<string> {
    const userProgress = await this.getUserProgress(userId);
    return await this.steddieAI.analyzeGamePerformance(gameType, score, accuracy, technique, userProgress);
  }

  // Create practice session with AI
  async createPracticeSession(
    technique: string,
    difficulty: 'easy' | 'medium' | 'hard',
    culturalPreference?: string
  ): Promise<string> {
    return await this.steddieAI.createPracticeSession(technique, difficulty, culturalPreference);
  }

  // Get available learning paths
  getLearningPaths(): LearningPath[] {
    return this.learningPaths;
  }

  // Get recommended learning path for user
  getRecommendedPath(userProgress: UserProgress): LearningPath {
    if (userProgress.gamesPlayed < 5) {
      return this.learningPaths.find(p => p.id === 'memory_foundations')!;
    } else if (userProgress.strongTechniques.includes('loci')) {
      return this.learningPaths.find(p => p.id === 'number_systems')!;
    } else if (userProgress.strongTechniques.length >= 2) {
      return this.learningPaths.find(p => p.id === 'spatial_mastery')!;
    } else {
      return this.learningPaths.find(p => p.id === 'cultural_explorer')!;
    }
  }
}

// Export singleton instance
export const learningJourneyService = new LearningJourneyService();
