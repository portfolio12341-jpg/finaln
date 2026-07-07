import { NextRequest, NextResponse } from 'next/server';
import { getDb, saveDb, ContactMessage } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    const db = await getDb();
    
    const newMessage: ContactMessage = {
      id: `msg-${Date.now()}`,
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      date: new Date().toLocaleString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      read: false
    };

    db.messages = [newMessage, ...db.messages];
    await saveDb(db);

    return NextResponse.json({ success: true, message: 'Message sent successfully!' });
  } catch (error: any) {
    console.error('Contact message error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
