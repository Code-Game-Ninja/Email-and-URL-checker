import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ThreatFeedback } from '@/models/ThreatFeedback';

/**
 * GET /api/stats - Get database statistics
 * Returns comprehensive statistics about stored threats and emails
 */

export async function GET() {
  try {
    const db = await connectDB();
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }

    // Get total counts
    const totalEntries = await ThreatFeedback.countDocuments();
    const threatCount = await ThreatFeedback.countDocuments({ userFeedback: 'threat' });
    const safeCount = await ThreatFeedback.countDocuments({ userFeedback: 'safe' });

    // Get email risk level counts
    const highRiskEmails = await ThreatFeedback.countDocuments({ emailRiskLevel: 'high_risk' });
    const suspiciousEmails = await ThreatFeedback.countDocuments({ emailRiskLevel: 'suspicious' });
    const safeEmails = await ThreatFeedback.countDocuments({ emailRiskLevel: 'safe' });

    // Get AI prediction accuracy
    const dangerousPredictions = await ThreatFeedback.countDocuments({ aiPrediction: 'DANGEROUS' });
    const cautionPredictions = await ThreatFeedback.countDocuments({ aiPrediction: 'CAUTION' });
    const safePredictions = await ThreatFeedback.countDocuments({ aiPrediction: 'SAFE' });

    // Get content type breakdown
    const urlCount = await ThreatFeedback.countDocuments({ contentType: 'url' });
    const messageCount = await ThreatFeedback.countDocuments({ contentType: 'message' });

    // Get most common signals
    const signalAggregation = await ThreatFeedback.aggregate([
      { $unwind: '$signals' },
      { $group: { _id: '$signals', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Get most reported email addresses
    const emailAggregation = await ThreatFeedback.aggregate([
      { $unwind: '$extractedEmails' },
      { $match: { userFeedback: 'threat' } },
      { $group: { 
        _id: '$extractedEmails', 
        threatCount: { $sum: 1 } 
      }},
      { $sort: { threatCount: -1 } },
      { $limit: 10 },
    ]);

    // Calculate AI accuracy (when AI prediction matches user feedback)
    const accurateHighRisk = await ThreatFeedback.countDocuments({
      aiPrediction: 'DANGEROUS',
      userFeedback: 'threat',
    });
    const accurateSafe = await ThreatFeedback.countDocuments({
      aiPrediction: 'SAFE',
      userFeedback: 'safe',
    });
    const totalAccurate = accurateHighRisk + accurateSafe;
    const accuracyPercentage = totalEntries > 0 ? ((totalAccurate / totalEntries) * 100).toFixed(1) : '0';

    const stats = {
      overview: {
        totalEntries,
        threatCount,
        safeCount,
        threatPercentage: totalEntries > 0 ? ((threatCount / totalEntries) * 100).toFixed(1) : '0',
      },
      emailRiskLevels: {
        highRisk: highRiskEmails,
        suspicious: suspiciousEmails,
        safe: safeEmails,
      },
      aiPredictions: {
        dangerous: dangerousPredictions,
        caution: cautionPredictions,
        safe: safePredictions,
        accuracy: `${accuracyPercentage}%`,
      },
      contentTypes: {
        urls: urlCount,
        messages: messageCount,
      },
      topSignals: signalAggregation.map(s => ({
        signal: s._id,
        count: s.count,
      })),
      topThreateningEmails: emailAggregation.map(e => ({
        email: e._id,
        threatCount: e.threatCount,
      })),
      globalStats: {
        message: 'Based on real-world data: 48% of emails are spam, 3.4B phishing emails sent daily',
        spamPercentage: '48%',
        dailyPhishingEmails: '3.4 billion',
        averageCostPerBreach: '$4.91 million',
      },
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
