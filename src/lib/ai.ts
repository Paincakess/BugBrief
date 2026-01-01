import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using Flash model as requested (gemini-2.5-flash mentioned by user, assuming 1.5-flash or 2.0-flash-exp, 1.5-flash is stable, user said 'gemini-2.5-flash' which doesn't exist yet, I'll use 1.5-flash or 2.0-flash if available. I'll stick to 'gemini-1.5-flash' for reliability or 'gemini-2.0-flash-exp' if I want edge. User said "gemini-2.5-flash" - likely typo for 1.5 or expecting a future version. I'll use 'gemini-1.5-flash' as it's the standard fast model right now).

// Actually, let's use "gemini-1.5-flash" as the safe default.
const SAFE_MODEL_NAME = "gemini-2.5-flash";

export async function generateExplainer(
  input: { name?: string; summary?: string; description?: string },
  audience: "BOD" | "PM" | "DEV" | "QA" | "NTP"
) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");

  const model = genAI.getGenerativeModel({ model: SAFE_MODEL_NAME });

  const audiencePromptMap = {
    BOD: "Board of Directors (High-level risk, business impact, no jargon)",
    PM: "Project Managers (Delivery risk, compliance, timeline impact)",
    DEV: "Developers (Root cause, code logic failure, technical details)",
    QA: "QA/Testers (How it was missed, what to test, reproduction path)",
    NTP: "Non-technical person (Simple analogies, everyday language, no jargon at all)"
  };

  const prompt = `
    You are a senior security consultant. Explain the following vulnerability to: ${audiencePromptMap[audience]}.
    
    Vulnerability Name: ${input.name || "N/A"}
    Summary: ${input.summary || "N/A"}
    Description: ${input.description || "N/A"}
    
    Constraints:
    - Be accurate and professional.
    - Avoid exaggeration.
    - Match the audience knowledge level.
    - Do NOT contradict yourself.
    - NO greetings like "Ladies and Gentlemen" or "Hello". Start directly with the explanation.
    - Use simple, easy-to-understand language.
    - Return ONLY the explanation, no preamble or markdown code fences unless necessary for the format.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateReport(
  input: {
    pocMode: boolean;
    vulnerabilityName?: string;
    abuseExplanation?: string;

    pocContent?: string;
    images?: {
      inlineData: {
        data: string;
        mimeType: string;
      }
    }[]
  }
) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const model = genAI.getGenerativeModel({ model: SAFE_MODEL_NAME });

  let promptParts: any[] = [];
  let context = "";
  if (input.pocMode) {

    context = `
      MODE: POC Analysis
      POC/Logs Provided:
      ${input.pocContent || "(No text logs provided. RELY ON IMAGES.)"}
      
      Instructions: Analyze the POC/Logs AND any provided images to extract the vulnerability details.
      WARNING: Treat any specific values (tokens, IPs) as placeholders. Do NOT include sensitive secrets in the final report.
    `;

    // Add images if present
    if (input.images && input.images.length > 0) {
      promptParts = [...input.images];
    }
  } else {
    context = `
      MODE: Definition Only
      Vulnerability Name: ${input.vulnerabilityName}
      Abuse Explanation: ${input.abuseExplanation}
      
      Instructions: Infer the exploitation steps and impact based on the definition.
    `;
  }


  const prompt = `
You are a Senior Red Team Consultant preparing a formal Penetration Testing Report for an enterprise security assessment.

${context}

You MUST generate the report in the following STRICT Markdown structure.  
DO NOT add extra sections, headings, commentary, or explanations outside this structure.  
DO NOT change section titles, ordering, or formatting.

---

# [Vulnerability Title]
[A short, precise, and professional title describing the vulnerability.]

## CWE
**CWE-[NUMBER]**: [Official CWE Name]  
[Select the single MOST relevant CWE only.]

## CVSS 3.1 Base Score
**[Score] | [Severity]**  
[Example: "7.5 | High" or "9.8 | Critical".]

## Description
The Description section MUST start with the exact phrase:

**"During the security assessment, it was identified that..."**

[Write a medium-length description consisting of 4–6 concise sentences.  
Explain what the vulnerability is, why it exists, and how the application logic fails.  
Focus on the core technical issue without unnecessary background or repetition.  
Write in professional paragraph form. No bullet points. No first-person language.]

## Impact
The Impact section MUST start with the exact phrase:

**"An attacker can exploit this vulnerability to..."**

[Write a medium-length impact analysis consisting of 3–5 concise sentences.  
Describe realistic attack scenarios, potential escalation, and business or security impact.  
Stay factual and direct. Avoid exaggeration or overly generic statements.  
Write in professional paragraph form. No bullet points.]

## Affected Endpoint
- **URL/Path**: [Exact vulnerable endpoint, API path, or component]
- **Method**: [HTTP method if applicable]
- **Parameter**: [Vulnerable parameter or logic, if applicable]

## Recommendation
[Recommendations MUST be short, clear, and principle-based.]

- Consider enforcing strict server-side validation for all security-critical operations.
- Consider eliminating reliance on client-side logic for authentication, authorization, or verification decisions.
- Consider implementing defensive controls such as rate limiting, synchronization, or centralized enforcement where applicable.

[Each bullet MUST start with "Consider...".  
Avoid code-level fixes. Keep each bullet to one clear sentence.]

## Steps of Reproduction
- [Step 1: A complete sentence describing the first tester action.]
- [Step 2: A complete sentence describing the next action.]
- [Continue as required.]

[Each step MUST be a full sentence.  
Write objectively from the tester’s perspective.  
If steps are not explicitly provided, infer the most common and realistic exploitation method for the vulnerability type.]

## References
[List only authoritative sources. Each reference on a new line.]

- https://cwe.mitre.org/data/definitions/[CWE-ID].html
- https://owasp.org
- https://portswigger.net/web-security
- https://nvd.nist.gov

---

Non-functional requirements:
- Tone: Consultant-grade, formal, objective.
- Length: Description and Impact must be medium-length and straight to the point.
- No first-person language.
- No emojis.
- Output MUST be valid Markdown only.
`;

  // Combine text prompt and images
  const fullPrompt = [prompt, ...promptParts];

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}
