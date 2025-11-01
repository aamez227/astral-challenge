import { GoogleGenAI } from "@google/genai";

const genAI = new GoogleGenAI({});

export interface GeneratedImage {
  url: string;
  alt: string;
  description: string;
}

export async function generateLessonImage(outline: string, context: string): Promise<GeneratedImage | null> {
  try {
    // For now, we'll use a simple approach with Gemini to generate SVG images
    // In a production environment, you might want to use a dedicated image generation service
    
    const prompt = `Create an inline SVG image that would be educational and relevant for this lesson: "${outline}"
    
Context: ${context}

Requirements:
- Generate ONLY valid SVG markup (no explanations)
- Size should be 400x300
- Use educational colors and clear, simple graphics
- Make it interactive if possible (hover effects, etc.)
- Include proper accessibility attributes
- Focus on educational value and visual learning

Return ONLY the SVG code, nothing else.`;

    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });

    const svgContent = result.text?.trim();
    
    if (!svgContent || !svgContent.includes('<svg')) {
      return null;
    }

    // Clean the SVG content
    const cleanSvg = svgContent
      .replace(/```svg\n?/g, '')
      .replace(/\n?```/g, '')
      .trim();

    // Create a data URL for the SVG
    const dataUrl = `data:image/svg+xml;base64,${btoa(cleanSvg)}`;

    return {
      url: dataUrl,
      alt: `Educational diagram for: ${outline}`,
      description: `AI-generated educational visualization for the lesson: ${outline}`
    };

  } catch (error) {
    console.error('Error generating lesson image:', error);
    return null;
  }
}

export function generateEducationalSVG(topic: string, type: 'diagram' | 'chart' | 'illustration' = 'diagram'): string {
  // Fallback function to generate simple educational SVGs programmatically
  const width = 400;
  const height = 300;
  
  switch (type) {
    case 'chart':
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" className="border rounded">
        <rect x="50" y="250" width="40" height="100" fill="#3b82f6" />
        <rect x="120" y="200" width="40" height="150" fill="#10b981" />
        <rect x="190" y="150" width="40" height="200" fill="#f59e0b" />
        <rect x="260" y="100" width="40" height="250" fill="#ef4444" />
        <text x="200" y="30" textAnchor="middle" className="text-lg font-semibold">${topic} Chart</text>
        <text x="70" y="280" textAnchor="middle" className="text-sm">A</text>
        <text x="140" y="280" textAnchor="middle" className="text-sm">B</text>
        <text x="210" y="280" textAnchor="middle" className="text-sm">C</text>
        <text x="280" y="280" textAnchor="middle" className="text-sm">D</text>
      </svg>`;
      
    case 'illustration':
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" className="border rounded">
        <circle cx="200" cy="150" r="80" fill="#ddd6fe" stroke="#7c3aed" strokeWidth="3" />
        <circle cx="200" cy="150" r="50" fill="#fbbf24" />
        <text x="200" y="60" textAnchor="middle" className="text-lg font-semibold">${topic}</text>
        <text x="200" y="250" textAnchor="middle" className="text-sm">Interactive Educational Element</text>
      </svg>`;
      
    default: // diagram
      return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" className="border rounded">
        <rect x="50" y="100" width="100" height="60" fill="#dbeafe" stroke="#3b82f6" strokeWidth="2" rx="5" />
        <rect x="250" y="100" width="100" height="60" fill="#dcfce7" stroke="#16a34a" strokeWidth="2" rx="5" />
        <line x1="150" y1="130" x2="250" y2="130" stroke="#6b7280" strokeWidth="2" markerEnd="url(#arrowhead)" />
        <text x="100" y="135" textAnchor="middle" className="text-sm font-medium">Input</text>
        <text x="300" y="135" textAnchor="middle" className="text-sm font-medium">Output</text>
        <text x="200" y="50" textAnchor="middle" className="text-lg font-semibold">${topic} Process</text>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>
      </svg>`;
  }
}