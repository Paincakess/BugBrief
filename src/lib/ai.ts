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
    pocContent?: string
  }
) {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
  const model = genAI.getGenerativeModel({ model: SAFE_MODEL_NAME });

  let context = "";
  if (input.pocMode) {
    context = `
      MODE: POC Analysis
      POC/Logs Provided:
      ${input.pocContent}
      
      Instructions: Analyze the POC/Logs to extract the vulnerability details.
      WARNING: Treat any specific values (tokens, IPs) as placeholders. Do NOT include sensitive secrets in the final report.
    `;
  } else {
    context = `
      MODE: Definition Only
      Vulnerability Name: ${input.vulnerabilityName}
      Abuse Explanation: ${input.abuseExplanation}
      
      Instructions: Infer the exploitation steps and impact based on the definition.
    `;
  }

  const prompt = `
    You are a lead Red Teamer writing a formal Penetration Test Report.
    
    ${context}
    
    You must generate a report in the following STRICT Markdown format. Do not deviate.
    
    # [Vulnerability Title]
    [A short, specific title for the vulnerability, e.g., "CORS Misconfiguration" or "IDOR in Order API". Concise and descriptive.]
    
    ## CWE
    **CWE-[NUMBER]**: [CWE Name]
    [Select the MOST relevant CWE for this vulnerability. Only one CWE.]
    
    ## CVSS 3.1 Base Score
    **[Score]** | **[Severity]**
    [Provide your best estimate. Format: "7.5 | High" or "9.8 | Critical". User can adjust via calculator.]
    
    ## Description
    [Explain what the vulnerability is, what caused it, and how the logic failed. Technical but readable. Professional paragraphs.]
    
    ## Impact
    An attacker can... [Describe primary abuse, escalation, and business impact. No bullets. Professional paragraphs.]
    
    ## Affected Endpoint
    - **URL/Path**: [The specific endpoint, API path, or component affected]
    - **Method**: [HTTP method if applicable: GET, POST, PUT, DELETE, etc.]
    - **Parameter**: [Vulnerable parameter if applicable]
    
    ## Recommendation
    [Bulleted list. Use "Consider..." phrasing. Do NOT prescribe exact code fixes. Focus on defensive principles.]
    
    ## Steps of Reproduction
    1. [First step - clear, actionable instruction]
    2. [Second step]
    3. [Continue as needed]
    [Numbered list from tester's perspective. Clear but not exploitative. Include expected vs actual results.
    IMPORTANT: If specific steps are not provided in the input, research the most common/optimal exploitation method for this vulnerability type and correlate with the evidence provided. Base the steps on industry-standard testing methodologies.]
    
    ## References
    [List of real, reputable links (OWASP, PortSwigger, CWE, NIST). No Medium/Blogs. Include the CWE link. Each reference on a new line.]
    
    Non-functional constraints:
    - Tone: Consultant-grade, professional, objective.
    - No sensationalism.
    - No "I" or "We", use passive or objective voice ("The application fails to...").
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}
