import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { ThreatFeedback } from '@/models/ThreatFeedback';
import { extractEmails, getOverallEmailRisk } from '@/lib/emailExtractor';

interface FeedbackRequest {
  content: string;
  contentType: 'url' | 'message';
  userFeedback: 'safe' | 'threat';
  aiPrediction: 'SAFE' | 'CAUTION' | 'DANGEROUS';
  fraudProbability: number;
  signals: string[];
}

export async function POST(request: Request) {
  try {
    console.log('💾 Feedback save started');
    const startTime = Date.now();
    
    const db = await connectDB();
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available. Please set up MongoDB to use feedback features.' },
        { status: 503 }
      );
    }
    
    const body: FeedbackRequest = await request.json();
    const { content, contentType, userFeedback, aiPrediction, fraudProbability, signals } = body;

    if (!content || !contentType || !userFeedback || !aiPrediction) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Extract emails and analyze risk (quick operation)
    const extractedEmails = extractEmails(content);
    const emailRiskLevel = getOverallEmailRisk(extractedEmails);

    // Use findOneAndUpdate with upsert for single DB operation (faster)
    await ThreatFeedback.findOneAndUpdate(
      { content, contentType }, // Find by content and type
      {
        $set: {
          userFeedback,
          aiPrediction,
          fraudProbability,
          signals,
          extractedEmails,
          emailRiskLevel,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        }
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true,    // Return updated document
      }
    );

    const duration = Date.now() - startTime;
    console.log(`✅ Feedback saved in ${duration}ms`);

    return NextResponse.json({ success: true, message: 'Feedback saved successfully' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    return NextResponse.json(
      { error: 'Failed to save feedback' },
      { status: 500 }
    );
  }
}

// Get historical feedback for learning
export async function GET(request: Request) {
  try {
    const db = await connectDB();
    
    if (!db) {
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const content = searchParams.get('content');
    const contentType = searchParams.get('contentType');

    if (content && contentType) {
      // Get feedback for specific content
      const feedback = await ThreatFeedback.findOne({
        content,
        contentType,
      });
      
      return NextResponse.json({ feedback });
    }

    // Get all feedback for learning
    const feedbacks = await ThreatFeedback.find().limit(100).sort({ createdAt: -1 });
    return NextResponse.json({ feedbacks });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}
