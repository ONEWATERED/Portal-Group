import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_INSTRUCTION, RFI_ANALYSIS_SYSTEM_INSTRUCTION, EMAIL_GENERATION_SYSTEM_INSTRUCTION, EMAIL_DRAFTING_SYSTEM_INSTRUCTION, RISK_ANALYSIS_SYSTEM_INSTRUCTION, CLIENT_UPDATE_SYSTEM_INSTRUCTION, PHOTO_CAPTION_VISION_SYSTEM_INSTRUCTION, PHOTO_CAPTION_VOICE_SYSTEM_INSTRUCTION, TEST_ANALYSIS_SYSTEM_INSTRUCTION, EXPENSE_ANALYSIS_SYSTEM_INSTRUCTION, DAILY_LOG_FORMATTING_SYSTEM_INSTRUCTION, DAILY_LOG_AI_ASSIST_SYSTEM_INSTRUCTION, TASK_DESCRIPTION_SYSTEM_INSTRUCTION } from '../constants';
import type { FormState, GeminiResponse, Project, Email, CompanySettings, RiskCategory, RiskSeverity, Contact, RiskItem, ClientUpdate, TestInstance, Expense, ExpenseCategory, DailyLog } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    estimate_json: {
      type: Type.OBJECT,
      properties: {
        project_id: { type: Type.STRING },
        scope_summary: { type: Type.STRING },
        assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
        line_items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING },
              unit: { type: Type.STRING },
              qty: { type: Type.NUMBER },
              confidence: { type: Type.STRING },
              notes: { type: Type.STRING },
            },
            required: ["item", "unit", "qty", "confidence", "notes"],
          },
        },
        exclusions: { type: Type.ARRAY, items: { type: Type.STRING } },
      },
      required: ["project_id", "scope_summary", "assumptions", "line_items", "exclusions"],
    },
    proposal_text: { type: Type.STRING },
    bid_reply_email: { type: Type.STRING },
    rfi_list: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          subject: { type: Type.STRING },
          question: { type: Type.STRING },
        },
        required: ["subject", "question"],
      },
    },
  },
  required: ["estimate_json", "proposal_text", "bid_reply_email", "rfi_list"],
};

const dailyLogAssistSchema = {
    type: Type.OBJECT,
    properties: {
        weather: {
            type: Type.OBJECT,
            properties: {
                temperature: { type: Type.NUMBER },
                conditions: { type: Type.STRING, enum: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Rain', 'Windy', 'Snow', 'Fog'] },
                notes: { type: Type.STRING },
            },
        },
        manpower: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    company: { type: Type.STRING },
                    workers: { type: Type.NUMBER },
                    hours: { type: Type.NUMBER },
                    location: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        equipment: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    hoursOperating: { type: Type.NUMBER },
                    hoursIdle: { type: Type.NUMBER },
                    location: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        workCompleted: {
            type: Type.ARRAY,
            items: { type: Type.OBJECT, properties: { description: { type: Type.STRING } } },
        },
        deliveries: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    time: { type: Type.STRING },
                    deliveryFrom: { type: Type.STRING },
                    trackingNumber: { type: Type.STRING },
                    contents: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        visitors: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    visitor: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        delays: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    type: { type: Type.STRING },
                    startTime: { type: Type.STRING },
                    endTime: { type: Type.STRING },
                    duration: { type: Type.NUMBER },
                    location: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        safetyAndIncidents: {
            type: Type.OBJECT,
            properties: {
                toolboxTalkTopic: { type: Type.STRING },
                safetyViolations: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            time: { type: Type.STRING },
                            subject: { type: Type.STRING },
                            issuedTo: { type: Type.STRING },
                            comments: { type: Type.STRING },
                        },
                    },
                },
                accidents: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            time: { type: Type.STRING },
                            partyInvolved: { type: Type.STRING },
                            companyInvolved: { type: Type.STRING },
                            comments: { type: Type.STRING },
                        },
                    },
                },
                generalObservations: { type: Type.STRING },
            },
        },
        waste: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    time: { type: Type.STRING },
                    material: { type: Type.STRING },
                    disposedBy: { type: Type.STRING },
                    method: { type: Type.STRING },
                    location: { type: Type.STRING },
                    quantity: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        quantities: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    costCode: { type: Type.STRING },
                    quantity: { type: Type.NUMBER },
                    units: { type: Type.STRING },
                    location: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
        notes: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    location: { type: Type.STRING },
                    comments: { type: Type.STRING },
                },
            },
        },
    },
};



const emailGenerationSchema = {
    type: Type.OBJECT,
    properties: {
        emails: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    from: { type: Type.STRING },
                    subject: { type: Type.STRING },
                    body: { type: Type.STRING },
                },
                required: ["from", "subject", "body"],
            },
        },
    },
    required: ["emails"],
};

const emailDraftingSchema = {
    type: Type.OBJECT,
    properties: {
        subject: { type: Type.STRING },
        body: { type: Type.STRING },
    },
    required: ["subject", "body"],
};

const riskAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        risks: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    category: { type: Type.STRING },
                    severity: { type: Type.STRING },
                    mitigationPlan: { type: Type.STRING },
                },
                required: ["description", "category", "severity", "mitigationPlan"],
            },
        },
    },
    required: ["risks"],
};

const clientUpdateSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING },
                    content: { type: Type.STRING },
                },
                required: ["heading", "content"],
            },
        },
    },
    required: ["title", "summary", "sections"],
};

const testAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        tests: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    date: { type: Type.STRING },
                    location: { type: Type.STRING },
                    requiredSpec: { type: Type.STRING },
                    actualResult: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Pass', 'Fail', 'Pending'] },
                    notes: { type: Type.STRING },
                },
                required: ["name", "date", "location", "requiredSpec", "actualResult", "status", "notes"],
            },
        },
    },
    required: ["tests"],
};

const expenseAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        vendor: { type: Type.STRING },
        date: { type: Type.STRING },
        amount: { type: Type.NUMBER },
        description: { type: Type.STRING },
        category: { type: Type.STRING },
    },
    required: ["vendor", "date", "amount", "description", "category"],
};


// Helper function to convert File to base64
async function fileToGenerativePart(file: File) {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
}


function buildUserPrompt(formData: FormState): string {
    return `
mode: ${formData.mode}
project_id: ${formData.projectId}
project_name: ${formData.projectName}
trade: ${formData.trade}
jurisdiction: ${formData.jurisdiction}
plan_text: |
  ${formData.planText}
gc_questions: |
  ${formData.gcQuestions}
known_constraints: |
  ${formData.knownConstraints}
`;
}

export async function generateEstimateAndProposal(formData: FormState): Promise<GeminiResponse> {
  const userPrompt = buildUserPrompt(formData);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      },
    });

    const text = response.text.trim();
    if (!text) {
        throw new Error("Received an empty response from the API.");
    }
    
    const cleanedText = text.replace(/^```json\s*|```$/g, '');
    
    const parsedResponse: GeminiResponse = JSON.parse(cleanedText);
    return parsedResponse;

  } catch (error) {
    console.error("Error calling Gemini API for estimate:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate content: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the Gemini API.");
  }
}

export async function generateStructuredLogFromNotes(rawNotes: string): Promise<Partial<Omit<DailyLog, 'id' | 'date' | 'status' | 'rawNotes' | 'photoIds'>>> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Parse the following daily notes:\n\n---\n${rawNotes}\n---`,
            config: {
                systemInstruction: DAILY_LOG_AI_ASSIST_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: dailyLogAssistSchema,
                temperature: 0.3,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for daily log assist.");
        }
        
        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsed: any = JSON.parse(cleanedText);

        // Transform the parsed data to match the DailyLog structure, adding unique IDs
        const structuredData: Partial<Omit<DailyLog, 'id' | 'date' | 'status'>> = {
            weather: parsed.weather,
            manpower: (parsed.manpower || []).map((m: any) => ({ ...m, id: `mp-${Date.now()}-${Math.random()}` })),
            equipment: (parsed.equipment || []).map((e: any) => ({ ...e, id: `eq-${Date.now()}-${Math.random()}` })),
            workCompleted: (parsed.workCompleted || []).map((w: any) => ({ ...w, id: `wc-${Date.now()}-${Math.random()}` })),
            deliveries: (parsed.deliveries || []).map((d: any) => ({ ...d, id: `dv-${Date.now()}-${Math.random()}` })),
            visitors: (parsed.visitors || []).map((v: any) => ({ ...v, id: `vi-${Date.now()}-${Math.random()}` })),
            delays: (parsed.delays || []).map((d: any) => ({ ...d, id: `dl-${Date.now()}-${Math.random()}` })),
            safetyAndIncidents: {
                ...(parsed.safetyAndIncidents || {}),
                safetyViolations: (parsed.safetyAndIncidents?.safetyViolations || []).map((sv: any) => ({ ...sv, id: `sv-${Date.now()}-${Math.random()}` })),
                accidents: (parsed.safetyAndIncidents?.accidents || []).map((a: any) => ({ ...a, id: `ac-${Date.now()}-${Math.random()}` })),
            },
            waste: (parsed.waste || []).map((w: any) => ({ ...w, id: `wa-${Date.now()}-${Math.random()}` })),
            quantities: (parsed.quantities || []).map((q: any) => ({ ...q, id: `qu-${Date.now()}-${Math.random()}` })),
            notes: (parsed.notes || []).map((n: any) => ({ ...n, id: `no-${Date.now()}-${Math.random()}` })),
        };

        return structuredData;

    } catch (error) {
        console.error("Error calling Gemini API for daily log assist:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to parse daily log notes: ${error.message}`);
        }
        throw new Error("An unknown error occurred while assisting with the daily log.");
    }
}


export async function formatDailyLogNotes(notes: string, projectName: string, date: string, userName: string): Promise<string> {
    const userPrompt = `
Project Name: ${projectName}
Date: ${date}
Author: ${userName}
Raw Notes:
---
${notes}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: DAILY_LOG_FORMATTING_SYSTEM_INSTRUCTION,
                temperature: 0.3,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API.");
        }
        return text;

    } catch (error) {
        console.error("Error calling Gemini API for daily log formatting:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to format daily log notes: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
}

export async function generateTaskDescription(prompt: string): Promise<string> {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: TASK_DESCRIPTION_SYSTEM_INSTRUCTION,
                temperature: 0.7,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the AI.");
        }
        return text;

    } catch (error) {
        console.error("Error calling Gemini API for task description:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate task description: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the task description.");
    }
}

export async function analyzeRfiAnswer(question: string, answer: string): Promise<string> {
    const userPrompt = `
Here is the RFI and the response. Please provide your analysis.

**Original RFI Question:**
${question}

**Provided Answer:**
${answer}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: RFI_ANALYSIS_SYSTEM_INSTRUCTION,
                temperature: 0.3,
            },
        });
        
        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty analysis from the API.");
        }
        return text;

    } catch (error) {
        console.error("Error calling Gemini API for RFI analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze RFI answer: ${error.message}`);
        }
        throw new Error("An unknown error occurred while communicating with the Gemini API.");
    }
}

export async function generateProjectEmails(project: Project): Promise<Omit<Email, 'id' | 'read' | 'timestamp'>[]> {
    const userPrompt = `
Generate a set of sample emails for the following project:
- Project Name: ${project.name}
- Client Name: ${project.clientName}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: EMAIL_GENERATION_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: emailGenerationSchema,
                temperature: 0.8,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for email generation.");
        }

        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsedResponse: { emails: Omit<Email, 'id' | 'read' | 'timestamp'>[] } = JSON.parse(cleanedText);
        
        return parsedResponse.emails || [];

    } catch (error) {
        console.error("Error calling Gemini API for email generation:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate project emails: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating project emails.");
    }
}

export async function generateEmailDraft(prompt: string, project: Project, companySettings: CompanySettings): Promise<{ subject: string; body: string; }> {
    const userPrompt = `
User Prompt: "${prompt}"
Project Name: "${project.name}"
Client Name: "${project.clientName}"
Company Name: "${companySettings.name || 'Our Company'}"
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: EMAIL_DRAFTING_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: emailDraftingSchema,
                temperature: 0.5,
            },
        });
        
        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for email drafting.");
        }

        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsedResponse: { subject: string; body: string; } = JSON.parse(cleanedText);

        return parsedResponse;

    } catch (error) {
        console.error("Error calling Gemini API for email drafting:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to draft email: ${error.message}`);
        }
        throw new Error("An unknown error occurred while drafting the email.");
    }
}

export async function identifyProjectRisks(project: Project, allContacts: Contact[]): Promise<Omit<RiskItem, 'id' | 'status' | 'createdAt' | 'updates'>[]> {
    // Synthesize a focused summary of the project data for the AI
    const projectContext = {
        projectName: project.name,
        clientName: project.clientName,
        contacts: allContacts.filter(c => project.contactIds.includes(c.id)).map(c => `${c.name} (${c.role})`),
        openRfis: project.rfiManager.managedRfis.filter(r => r.status === 'Sent').map(r => ({ subject: r.subject, status: r.status })),
        failedInspections: project.inspections.filter(i => i.status === 'Failed').map(i => ({ type: i.type, reason: i.outcomeNotes })),
        recentUnreadEmails: project.email.filter(e => !e.read).slice(0, 5).map(e => ({ from: e.from, subject: e.subject })),
        changeOrders: project.invoicing.changeOrders.map(co => ({ description: co.description, value: co.value })),
    };

    const userPrompt = `Analyze the following project data summary and identify potential risks:\n\n${JSON.stringify(projectContext, null, 2)}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: RISK_ANALYSIS_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: riskAnalysisSchema,
                temperature: 0.4,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for risk analysis.");
        }

        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsedResponse: { risks: Omit<RiskItem, 'id' | 'status' | 'createdAt' | 'updates'>[] } = JSON.parse(cleanedText);

        // Validate categories and severities to match enum types
        const validCategories: RiskCategory[] = ['Schedule', 'Budget', 'Safety', 'Quality', 'Communication', 'Other'];
        const validSeverities: RiskSeverity[] = ['High', 'Medium', 'Low'];

        const validatedRisks = (parsedResponse.risks || []).map(risk => ({
            ...risk,
            category: validCategories.includes(risk.category as any) ? risk.category : 'Other',
            severity: validSeverities.includes(risk.severity as any) ? risk.severity : 'Medium',
        }));

        return validatedRisks;

    } catch (error) {
        console.error("Error calling Gemini API for risk analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to identify project risks: ${error.message}`);
        }
        throw new Error("An unknown error occurred while identifying project risks.");
    }
}

export async function generateClientUpdate(project: Project, userPrompt: string): Promise<Omit<ClientUpdate, 'id' | 'publicationDate' | 'status'>> {
    const projectDataSummary = {
        passedInspections: project.inspections.filter(i => i.status === 'Passed').map(i => i.type),
        failedInspections: project.inspections.filter(i => i.status === 'Failed').map(i => ({type: i.type, reason: i.outcomeNotes })),
        openRfis: project.rfiManager.managedRfis.filter(r => r.status === 'Sent').map(r => r.subject),
        answeredRfis: project.rfiManager.managedRfis.filter(r => r.status === 'Answered').map(r => ({ subject: r.subject, answer: r.answer })),
        recentChangeOrders: project.invoicing.changeOrders.slice(-3).map(co => co.description),
        activeRisks: project.riskManagement.risks.filter(r => r.status === 'Accepted').map(r => r.description),
    };

    const promptForAI = `
Project Name: ${project.name}
Client Name: ${project.clientName}
User Prompt: "${userPrompt}"
---
Recent Project Data Summary:
${JSON.stringify(projectDataSummary, null, 2)}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: promptForAI,
            config: {
                systemInstruction: CLIENT_UPDATE_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: clientUpdateSchema,
                temperature: 0.5,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for client update generation.");
        }

        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsed: { title: string; summary: string; sections: { heading: string; content: string }[] } = JSON.parse(cleanedText);
        
        // Add IDs to sections
        const sectionsWithIds = parsed.sections.map(section => ({
            ...section,
            id: `sec-${Date.now()}-${Math.random()}`,
            imageUrls: [],
        }));
        
        return { ...parsed, sections: sectionsWithIds };

    } catch (error) {
        console.error("Error calling Gemini API for client update:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate client update: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the client update.");
    }
}

export async function generatePhotoCaptionFromImage(file: File): Promise<string> {
    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: "Describe this construction photo for a project album." };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: PHOTO_CAPTION_VISION_SYSTEM_INSTRUCTION,
                temperature: 0.4,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty caption from the API.");
        }
        return text;

    } catch (error) {
        console.error("Error calling Gemini API for image captioning:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate caption from image: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the image caption.");
    }
}

export async function generatePhotoCaptionFromVoice(transcript: string): Promise<string> {
    const userPrompt = `Please create a caption from the following transcript:\n\n"${transcript}"`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: PHOTO_CAPTION_VOICE_SYSTEM_INSTRUCTION,
                temperature: 0.6,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty caption from the API.");
        }
        return text;

    } catch (error) {
        console.error("Error calling Gemini API for voice captioning:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate caption from voice: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the voice caption.");
    }
}

export async function analyzeTestDocument(testReportText: string, projectSpecText: string): Promise<Omit<TestInstance, 'id' | 'sourceDocumentId'>[]> {
    const userPrompt = `
Here is the project specification text and the test report text. Please analyze them and return the structured test results.

--- PROJECT SPECIFICATIONS ---
${projectSpecText}

--- TEST REPORT ---
${testReportText}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userPrompt,
            config: {
                systemInstruction: TEST_ANALYSIS_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: testAnalysisSchema,
                temperature: 0.1,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for test analysis.");
        }

        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsedResponse: { tests: Omit<TestInstance, 'id' | 'sourceDocumentId'>[] } = JSON.parse(cleanedText);

        return parsedResponse.tests || [];

    } catch (error) {
        console.error("Error calling Gemini API for test analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze test document: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the test document.");
    }
}

export async function analyzeReceiptImage(file: File): Promise<Omit<Expense, 'id' | 'invoicable' | 'status' | 'sourceReceiptId'>> {
    const imagePart = await fileToGenerativePart(file);
    const textPart = { text: "Analyze this receipt and extract the expense data." };

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: { parts: [imagePart, textPart] },
            config: {
                systemInstruction: EXPENSE_ANALYSIS_SYSTEM_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: expenseAnalysisSchema,
                temperature: 0.1,
            },
        });

        const text = response.text.trim();
        if (!text) {
            throw new Error("Received an empty response from the API for receipt analysis.");
        }

        const cleanedText = text.replace(/^```json\s*|```$/g, '');
        const parsedResponse: Omit<Expense, 'id' | 'invoicable' | 'status' | 'sourceReceiptId'> = JSON.parse(cleanedText);
        
        return parsedResponse;

    } catch (error) {
        console.error("Error calling Gemini API for receipt analysis:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to analyze receipt: ${error.message}`);
        }
        throw new Error("An unknown error occurred while analyzing the receipt.");
    }
}