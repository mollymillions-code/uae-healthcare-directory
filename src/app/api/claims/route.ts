import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const { providerId, contactName, contactEmail, contactPhone, jobTitle, proofType, requestedChanges, notes } = body;

    if (!providerId || !contactName || !contactEmail || !contactPhone) {
      return NextResponse.json(
        { error: "Missing required fields: providerId, contactName, contactEmail, contactPhone" },
        { status: 400 }
      );
    }

    // In production, this would insert into the claim_requests table
    // For now, log the claim request
    console.log("New claim request:", {
      providerId,
      contactName,
      contactEmail,
      contactPhone,
      jobTitle,
      proofType,
      requestedChanges,
      notes,
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json(
      {
        success: true,
        message: "Claim request submitted successfully. We will review your request within 2-3 business days.",
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
