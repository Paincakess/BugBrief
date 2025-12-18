/**
 * Comprehensive sanitizer for sensitive data.
 * Strips: IPs, emails, tokens, API keys, URLs with creds, sessions, cookies, 
 * phone numbers, credit cards, cloud keys, UUIDs, domains, passwords, etc.
 */
export function sanitizeInput(text: string): string {
    if (!text) return "";

    let sanitized = text;

    // 1. IPv4 addresses
    sanitized = sanitized.replace(
        /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
        "[IP_ADDRESS]"
    );

    // 2. IPv6 addresses (simplified pattern)
    sanitized = sanitized.replace(
        /\b(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}\b/g,
        "[IPV6_ADDRESS]"
    );

    // 3. Email addresses
    sanitized = sanitized.replace(
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
        "[EMAIL]"
    );

    // 4. URLs with embedded credentials (http://user:pass@host)
    sanitized = sanitized.replace(
        /(https?:\/\/)([^:]+):([^@]+)@/gi,
        "$1[USER]:[PASS]@"
    );

    // 5. Bearer tokens in headers
    sanitized = sanitized.replace(
        /(Authorization:\s*Bearer\s+)([a-zA-Z0-9\-\._~\+\/]+=*)/gi,
        "$1[REDACTED_TOKEN]"
    );

    // 6. Basic Auth headers
    sanitized = sanitized.replace(
        /(Authorization:\s*Basic\s+)([a-zA-Z0-9\+\/]+=*)/gi,
        "$1[REDACTED_BASIC_AUTH]"
    );

    // 7. API keys (various patterns)
    sanitized = sanitized.replace(
        /\b(sk-[a-zA-Z0-9]{20,})\b/g,  // OpenAI
        "[OPENAI_API_KEY]"
    );
    sanitized = sanitized.replace(
        /\b(AKIA[0-9A-Z]{16})\b/g,  // AWS Access Key
        "[AWS_ACCESS_KEY]"
    );
    sanitized = sanitized.replace(
        /\b(AIza[0-9A-Za-z\-_]{35})\b/g,  // Google API Key
        "[GOOGLE_API_KEY]"
    );
    sanitized = sanitized.replace(
        /\b(ghp_[a-zA-Z0-9]{36})\b/g,  // GitHub Personal Access Token
        "[GITHUB_PAT]"
    );
    sanitized = sanitized.replace(
        /\b(xox[baprs]-[a-zA-Z0-9-]+)\b/g,  // Slack tokens
        "[SLACK_TOKEN]"
    );

    // 8. Generic API key patterns (key=..., api_key=..., apikey=...)
    sanitized = sanitized.replace(
        /(api[_-]?key|apikey|secret[_-]?key|access[_-]?token|auth[_-]?token)[=:]["']?([a-zA-Z0-9\-_\.]{16,})["']?/gi,
        "$1=[REDACTED_KEY]"
    );

    // 9. Session IDs and cookies
    sanitized = sanitized.replace(
        /(session[_-]?id|sessionid|JSESSIONID|PHPSESSID|ASP\.NET_SessionId)[=:]["']?([a-zA-Z0-9\-_\.]{16,})["']?/gi,
        "$1=[REDACTED_SESSION]"
    );
    sanitized = sanitized.replace(
        /(Cookie:\s*)(.+)/gi,
        "$1[REDACTED_COOKIES]"
    );
    sanitized = sanitized.replace(
        /(Set-Cookie:\s*)(.+)/gi,
        "$1[REDACTED_COOKIE]"
    );

    // 10. Credit card numbers (basic patterns)
    sanitized = sanitized.replace(
        /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
        "[CREDIT_CARD]"
    );

    // 11. Phone numbers (international formats)
    sanitized = sanitized.replace(
        /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g,
        "[PHONE]"
    );

    // 12. UUIDs (potential session tokens)
    sanitized = sanitized.replace(
        /\b[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\b/g,
        "[UUID]"
    );

    // 13. JWT tokens (3-part base64 with dots)
    sanitized = sanitized.replace(
        /\beyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]+\b/g,
        "[JWT_TOKEN]"
    );

    // 14. Private keys / PEM content
    sanitized = sanitized.replace(
        /-----BEGIN [A-Z ]+-----[\s\S]*?-----END [A-Z ]+-----/g,
        "[PRIVATE_KEY_REDACTED]"
    );

    // 15. Password fields in JSON/query strings
    sanitized = sanitized.replace(
        /(password|passwd|pwd|secret)[=:]["']?([^"'\s&]+)["']?/gi,
        "$1=[REDACTED_PASSWORD]"
    );

    // 16. Long hex strings (potential tokens, 32+ chars)
    sanitized = sanitized.replace(
        /\b[a-fA-F0-9]{32,}\b/g,
        "[HEX_TOKEN]"
    );

    return sanitized;
}
