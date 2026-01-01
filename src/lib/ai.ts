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
PERSONA: You are a Senior Red Team Consultant with 12+ years of experience across Fortune 500 companies, financial institutions, and critical infrastructure. You've written over 500 penetration testing reports. Your reputation is built on clear, actionable findings that executives respect and developers can act on. You've trained junior consultants on report writing.

CURRENT ENGAGEMENT: You're preparing a vulnerability finding for a formal Penetration Testing Report. The client pays premium rates and expects polished, professional deliverables. Your findings will be reviewed by the CISO and distributed to development teams.

${context}

REPORT STRUCTURE (STRICT - Do not deviate):
Follow this exact Markdown structure. No extra sections, no commentary, no explanations outside this format.

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
[Start with "During the security assessment, it was identified that..." and continue flowing naturally into the description.
Write a professional description consisting of 4–6 concise sentences as a single cohesive paragraph.  
Explain what the vulnerability is, why it exists, and how the application logic fails.  
Focus on the core technical issue without unnecessary background or repetition.  
No bullet points. No first-person language. Do NOT put the opening phrase in bold or quotes - it should flow naturally.]

## Impact
[Start with "An attacker can exploit this vulnerability to..." and continue flowing naturally into the impact analysis.
Write a professional impact analysis consisting of 3–5 concise sentences as a single cohesive paragraph.  
Describe realistic attack scenarios, potential escalation, and business or security impact.  
Stay factual and direct. Avoid exaggeration or overly generic statements.  
No bullet points. Do NOT put the opening phrase in bold or quotes - it should flow naturally.]

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
Write objectively from the tester's perspective.  
If steps are not explicitly provided, infer the most common and realistic exploitation method for the vulnerability type.]

## References
[List only authoritative sources. Each reference on a new line.]

- https://cwe.mitre.org/data/definitions/[CWE-ID].html
- https://owasp.org
- https://portswigger.net/web-security
- https://nvd.nist.gov

---

QUALITY STANDARDS (Non-negotiable):
- This is a $50,000 engagement. Write like it.
- Every sentence should justify its existence. Cut fluff ruthlessly.
- Be technically precise but accessible to non-technical executives.
- Findings should be immediately actionable by developers.
- No hedging language unless genuinely uncertain.

HUMANIZATION (CRITICAL):
- BANNED WORDS: "crucial", "robust", "comprehensive", "streamlined", "leverage", "utilize", "facilitate", "enhance", "optimize", "seamless", "cutting-edge", "holistic", "synergy", "paradigm", "ecosystem", "scalable", "proactive", "innovative", "dynamic", "pivotal", "vital", "substantial", "significant", "notable", "remarkable", "imperative", "essential", "fundamental", "ensure"
- BANNED OPENERS: "It is worth noting", "It is important to", "This allows", "This enables", "This ensures", "Furthermore", "Moreover", "Additionally", "In conclusion"
- BANNED FILLER: "In order to", "Due to the fact that", "It should be noted that", "It is evident that"
- Write like you're explaining the finding to a sharp colleague over coffee, not presenting a thesis.
- Mix sentence lengths. Short sentences hit hard. Longer ones provide necessary context when warranted.
- Be direct. Say what IS, not what "can be" or "may be".
- Output MUST be valid Markdown only. No first-person. No emojis.
`;


  // Combine text prompt and images
  const fullPrompt = [prompt, ...promptParts];

  const result = await model.generateContent(fullPrompt);
  return result.response.text();
}
