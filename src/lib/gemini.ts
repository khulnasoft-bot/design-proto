import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import { BusinessMemory, SitePage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateResearchResponse(
  prompt: string, 
  history: any[] = [], 
  businessMemory?: BusinessMemory,
  useThinking: boolean = false
) {
  const model = useThinking ? "gemini-3.1-pro-preview" : "gemini-3-flash-preview";
  
  const systemInstruction = `You are a world-class business research and strategy assistant.
${businessMemory ? `\nBUSINESS CONTEXT:
Name: ${businessMemory.businessName}
Industry: ${businessMemory.industry}
Key Offerings: ${businessMemory.keyOfferings.join(', ')}
Brand Voice: ${businessMemory.brandVoice}
` : ""}
Provide deep, synthesized insights. If requested to generate site content, use the business memory to ensure consistency.
Focus on accuracy, depth, and strategic value.

VISUALIZATIONS:
If your research involves data points, trends, or comparisons, you MUST provide a visualization using Vega-Lite. 
Format your visualization as a JSON block inside a code block tagged with 'vega-lite'.
Example:
\`\`\`vega-lite
{
  "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
  "description": "A simple bar chart with embedded data.",
  "data": {
    "values": [
      {"a": "A", "b": 28}, {"a": "B", "b": 55}, {"a": "C", "b": 43}
    ]
  },
  "mark": "bar",
  "encoding": {
    "x": {"field": "a", "type": "nominal", "axis": {"labelAngle": 0}},
    "y": {"field": "b", "type": "quantitative"}
  }
}
\`\`\`
Ensure the data reflects your research findings.`;

  try {
    const config: any = {
      systemInstruction,
    };

    if (useThinking && model === "gemini-3.1-pro-preview") {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }
    
    // Always enable Google Search for research grounding
    config.tools = [{ googleSearch: {} }];

    const response = await ai.models.generateContent({
      model,
      contents: [
        ...history,
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config,
    });

    return {
      text: response.text || "No response generated.",
      sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map((chunk: any) => ({
        id: Math.random().toString(36).substring(7),
        title: chunk.web?.title || 'Source',
        url: chunk.web?.uri || '',
      })) || []
    };
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
}

export async function generateSiteContent(
  pageType: SitePage['type'],
  businessMemory: BusinessMemory,
  additionalNotes: string = ""
) {
  const model = "gemini-3.1-pro-preview";
  
  const prompt = `Generate high-fidelity content for a ${pageType} page for the business: ${businessMemory.businessName}.
  
Context:
- Industry: ${businessMemory.industry}
- Target Audience: ${businessMemory.targetAudience}
- Brand Voice: ${businessMemory.brandVoice}
- Core Values: ${businessMemory.coreValues.join(', ')}
- Offerings: ${businessMemory.keyOfferings.join(', ')}

Additional Instructions: ${additionalNotes}

The output should be structured as clean Markdown with sections for Headers, Body Content, and Call-to-Actions.`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: "You are an expert web designer and copywriter. Generate professional, conversion-focused page content.",
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    return response.text || "Failed to generate page content.";
  } catch (error) {
    console.error("Site Generation Error:", error);
    throw error;
  }
}
