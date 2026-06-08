import { NextResponse } from "next/server";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";
import { GoogleAIFileManager } from "@google/generative-ai/server";
import { access } from "node:fs/promises";
import path from "node:path";

function getFallbackPrompt(subject: "biology" | "chemistry"): string {
  return `You are a patient CBSE senior-secondary ${subject.charAt(0).toUpperCase() + subject.slice(1)} tutor.

IMPORTANT RULES:
1. You MUST answer ONLY using information from the attached NCERT ${subject.charAt(0).toUpperCase() + subject.slice(1)} textbook PDF.
2. If the answer is not in the PDF, say "This topic is not covered in the provided textbook."
3. ALWAYS cite the specific chapter number and section from the PDF.
4. Quote relevant passages from the textbook when helpful.
5. Do NOT use any outside knowledge - only the PDF content.
6. After answering, offer a quick follow-up study tip based on the textbook content.`;
}

const PDF_PATHS = {
  biology: path.join(process.cwd(), "public", "reference", "biology-cbse-full-textbook.pdf"),
  chemistry: path.join(process.cwd(), "public", "reference", "chemistry-cbse-full-textbook.pdf"),
};

const MODEL_ID = "gemini-2.5-flash";

export const runtime = "nodejs";

// Cache uploaded PDF file references separately for each subject
const cachedPdfFiles: Record<"biology" | "chemistry", { uri: string; mimeType: string } | null> = {
  biology: null,
  chemistry: null,
};

function getDifficultyInstruction(difficulty: "easy" | "medium" | "advanced"): string {
  switch (difficulty) {
    case "easy":
      return `

DIFFICULTY LEVEL: EASY (Grade 5)
- Use VERY simple language and short sentences.
- Break down complex concepts into the most basic ideas.
- Use everyday analogies and examples that a 5th grader can relate to.
- Avoid technical jargon completely. If you must use a scientific term, explain it in extremely simple words.
- Keep your answer brief and focused on the core concept only.
- Use comparisons to familiar things (like comparing cells to rooms in a house).`;
    case "medium":
      return `

DIFFICULTY LEVEL: MEDIUM (Grade 8)
- Use clear, moderately simple language.
- Introduce scientific terminology but explain each term when you first use it.
- Include one or two key details beyond the basic concept.
- Use analogies when helpful, but also begin introducing proper biological processes.
- Balance simplicity with scientific accuracy.
- Your answer should prepare the student to understand more complex biology later.`;
    case "advanced":
      return `

DIFFICULTY LEVEL: ADVANCED (Grade 11-12)
- Use proper scientific terminology and precise language expected in CBSE 11-12 exams.
- Provide comprehensive explanations with mechanisms, processes, and interconnections.
- Include relevant biochemical pathways, molecular details, or physiological mechanisms.
- Discuss exceptions, variations, or advanced concepts when relevant.
- Connect the answer to related topics in the curriculum.
- Prepare the student for board exam-level questions on this topic.`;
  }
}

function ensureGeminiClient() {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GOOGLE_GEMINI_API_KEY. Add it to your .env.local file.");
  }

  return {
    client: new GoogleGenerativeAI(apiKey),
    fileManager: new GoogleAIFileManager(apiKey),
  };
}

async function getOrUploadPdf(
  fileManager: GoogleAIFileManager,
  subject: "biology" | "chemistry"
) {
  // Return cached file if already uploaded
  if (cachedPdfFiles[subject]) {
    return cachedPdfFiles[subject];
  }

  const pdfPath = PDF_PATHS[subject];
  try {
    await access(pdfPath);
  } catch {
    return null;
  }

  const upload = await fileManager.uploadFile(pdfPath, {
    mimeType: "application/pdf",
    displayName: `CBSE ${subject.charAt(0).toUpperCase() + subject.slice(1)} Textbook`,
  });

  // Cache the file reference
  cachedPdfFiles[subject] = {
    uri: upload.file.uri,
    mimeType: upload.file.mimeType,
  };

  return cachedPdfFiles[subject];
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userPrompt = typeof body?.prompt === "string" ? body.prompt : "";
  const question = typeof body?.question === "string" ? body.question.trim() : "";
  const difficulty = ["easy", "medium", "advanced"].includes(body?.difficulty)
    ? (body.difficulty as "easy" | "medium" | "advanced")
    : "medium";
  const subject = ["biology", "chemistry"].includes(body?.subject)
    ? (body.subject as "biology" | "chemistry")
    : "biology";

  if (!question) {
    return NextResponse.json(
      { error: "Ask a question before pinging the tutor." },
      { status: 400 }
    );
  }

  const basePrompt = userPrompt.trim() || getFallbackPrompt(subject);
  const systemPrompt = basePrompt + getDifficultyInstruction(difficulty);

  try {
    const { client, fileManager } = ensureGeminiClient();
    const model = client.getGenerativeModel({
      model: MODEL_ID,
      systemInstruction: systemPrompt,
    });

    const pdfUpload = await getOrUploadPdf(fileManager, subject);
    const parts: Part[] = [];

    // PDF must come FIRST so the model treats it as primary context
    if (pdfUpload) {
      parts.push({
        fileData: {
          fileUri: pdfUpload.uri,
          mimeType: pdfUpload.mimeType,
        },
      });
      parts.push({
        text: `The above PDF is the official NCERT ${subject} textbook. Use ONLY this PDF to answer the following question. Cite chapter numbers and quote relevant text.\n\nStudent question: ${question}`,
      });
    } else {
      parts.push({ text: `Student question: ${question}` });
    }

    const response = await model.generateContent(parts);

    const answer = response.response?.text()?.trim();

    return NextResponse.json({ answer: answer || "I could not generate an answer." });
  } catch (error) {
    console.error("/api/chat error", error);
    const message =
      error instanceof Error ? error.message : "The tutor hit a snag. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
