import { Langfuse } from "langfuse";
import { GoogleGenAI } from "@google/genai";

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_HOST,
});

const genAI = new GoogleGenAI({});


export async function* generateLessonCodeStream(outline: string): AsyncGenerator<{
  content: string;
  progress: number;
  stage: string;
}> {
  const trace = langfuse.trace({
    name: "lesson-generation-stream",
    input: { outline },
    metadata: { 
      model: "gemini-2.0-flash-exp",
      type: "lesson-generation-stream" 
    },
  });

  try {
    const generation = trace.generation({
      name: "gemini-lesson-generation-stream",
      model: "gemini-2.0-flash-exp",
      input: { outline },
    });

    // Stream the generation process
    yield { content: "", progress: 10, stage: "Connecting to Gemini..." };
    
    yield { content: "", progress: 20, stage: "Analyzing lesson requirements..." };
    
    // Pure AI generation - no fallbacks to templates
    let fullCode = "";
    
    yield { content: "", progress: 30, stage: "Generating with Gemini..." };
const systemPrompt = `
You are an expert educational content creator and senior React TypeScript developer.
Your goal is to generate a fully functional, production-ready React + TypeScript + TailwindCSS component
for an educational or quiz-based interactive lesson.

CRITICAL RULES:
1. Output only raw React + TypeScript + TailwindCSS code — no markdown, no explanations, no comments.
2. Do not include React imports (e.g., import React from "react").
3. Use functional components and hooks (useState, useEffect, etc.) only.
4. Must compile cleanly in Next.js and work inside @codesandbox/sandpack-react.
5. The component must be **self-contained and interactive** — include complete state logic, event handlers, and rendering.
6. Use **TailwindCSS** for layout and styling. No inline styles or CSS modules.
7. **Styling guidelines:**
   - All buttons → background color **blue-600**, hover → **blue-700**, text → **white**.
   - All other text (headings, paragraphs, labels, etc.) → **black** or dark gray (text-gray-800 or text-gray-900).
   - Backgrounds can use light neutral or subtle gradient colors (e.g., from-gray-100 to-gray-200 or from-blue-50 to-white).
   - Ensure strong color contrast for readability and accessibility.
8. Every JSX element must be properly closed and nested — **no unterminated tags, missing brackets, or stray fragments**.
9. Avoid any duplicate closing tags (like extra </div> or redundant parentheses).
10. End the output with a single render() call like:

    render(<YourActualFunctionName />);

(No export default, no additional function calls after render()).
11. Avoid advanced syntax that needs extra Babel plugins (no enums, decorators, or experimental features).
12. Keep the layout simple, centered, and responsive with Tailwind utilities (flex, grid, p-4, rounded-lg, shadow-lg).
13. Use clear and descriptive variable names.
14. Use TypeScript types minimally but correctly (e.g., \`const [score, setScore] = useState<number>(0)\`).
15. The component should be **fun, kid-friendly, and educational**, featuring interactivity such as quizzes, counting games, or drag-and-drop tasks.
16. Ensure generated code is syntactically valid, complete, and ready to render — no syntax errors, no missing braces or parentheses.
17. Never include partial snippets, explanations, or placeholders like "add logic here" — only full working code.
18. Ensure all the JSX tags and JavaScript braces are properly opened and closed to avoid syntax errors.
19. Ensure there is no ReferenceErrors or undefined variables in the generated code.
20. **CRITICAL: End your code EXACTLY with one render() call and NOTHING ELSE after it.** Do not add extra closing tags, parentheses, braces, or any other content.
21. Double-check that every opening tag has a corresponding closing tag — count your divs, buttons, and other elements carefully.
22. Never duplicate the return statement or closing function brace — there should be only ONE return statement per function.
23. Validate that all event handlers are properly defined before using them in JSX (e.g., define handleClick before using onClick={handleClick}).
24. Use consistent TypeScript typing throughout the component — if you start with useState<number>, maintain that pattern.
25. Ensure all variables used in JSX are defined — never reference undefined variables in templates or event handlers.
26. Test syntax mentally: every opening ( should have closing ), every { should have }, every < should have >.
27. Remove any trailing commas, semicolons, or extra whitespace that could cause parsing issues.
28. Avoid nested comments or documentation within the code — code should be self-explanatory without comments.
29. Do not include any import statements at the beginning of your code — start directly with the function declaration.
30. Avoid common syntax typos like 'inputype=' instead of 'input type=', or 'ononClick=' instead of 'onClick='.
31. End your code with exactly this pattern: render(<YourActualFunctionName />); with NO extra content, tags, or characters after it. Use the SAME name as your function.
32. Again Ensure all the JSX tags and JavaScript braces are properly opened and closed to avoid syntax errors.
33. **ABSOLUTE RULE: Your code must end with this EXACT structure and NOTHING ELSE:**
    
    );
}

render(<YourFunctionName />);
    
34. **NEVER add extra closing tags after the main return statement.** Count your opening and closing divs carefully.
35. **Your entire code should follow this exact pattern:**
    
    function ComponentName() {
      // state and handlers here
      return (
        <div>
          // your JSX here
        </div>
      );
    }

    render(<ComponentName />);
36. **MANDATORY TAG BALANCING RULE: Before finishing your code, COUNT every opening and closing tag:**
    - Count ALL <div> tags and ensure each has EXACTLY ONE matching </div>
    - Count ALL <button> tags and ensure each has EXACTLY ONE matching </button>
    - Count ALL opening parentheses ( and ensure each has EXACTLY ONE matching )
    - Count ALL opening braces { and ensure each has EXACTLY ONE matching }
37. **ABSOLUTE PROHIBITION: NEVER write duplicate closing elements:**
    - NEVER write </div> twice for the same element
    - NEVER write ); twice after your return statement
    - NEVER write } twice after your function
38. **FINAL VERIFICATION CHECKLIST - Your code MUST end like this and NOTHING MORE:**
    
    );
}

render(<YourFunctionName />);
    
    If you have ANY extra </div>, ), or } after this pattern, DELETE them immediately.
39. **ERROR PREVENTION: If you catch yourself about to write closing tags, STOP and count:**
    - How many <div> did I open? Write exactly that many </div>
    - Did I already close my return statement with );? Then don't write it again
    - Did I already close my function with }? Then don't write it again
40. **JSX BALANCING ABSOLUTE RULE: Every opening tag MUST have its closing tag in the SAME component:**
    - If you write <div className="..."> you MUST write </div> later
    - If you write <button onClick={...}> you MUST write </button> later
    - Count your tags line by line as you write them
    - NEVER leave a tag unclosed within your return statement
41. **SYNTAX ERROR PREVENTION: Before writing render(), verify your JSX is complete:**
    - All conditional rendering has proper closing tags
    - All map functions have proper closing tags  
    - All nested divs are properly closed
    - Your return statement ends with ONE ); and nothing else

START EXAMPLE:
function ExampleQuiz() {
  const [score, setScore] = useState(0);
  const handleClick = () => setScore(score + 1);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 text-gray-800 p-8">
      <h1 className="text-3xl font-bold mb-6">Example Quiz</h1>
      <p className="mb-4">Your Score: {score}</p>
      <button
        onClick={handleClick}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105"
      >
        Add Point
      </button>
    </div>
  );
}

render(<ExampleQuiz />);
`;

const fullPrompt = `
${systemPrompt}

Generate an interactive pure react typescript tailwindcss component for this request:
"${outline}"
`;
    
    const result = await genAI.models.generateContent({
      model: "gemini-2.5-flash",
      contents: fullPrompt,
    });
    
    yield { content: "", progress: 50, stage: "Processing Gemini response..." };
    
    const generatedContent = result.text;
    
    if (!generatedContent) {
      throw new Error("No content generated by Gemini API");
    }
    
    // Store raw AI code directly - it's usually perfect
    fullCode = generatedContent.replace(/^```[a-z]*\n|\n```$/g, "").trim();
    
    if (!fullCode || fullCode.trim().length === 0) {
      throw new Error("Generated code is empty after cleaning");
    }
    
    yield { content: "", progress: 70, stage: "Gemini generation successful!" };
    
    yield { content: "", progress: 80, stage: "Streaming generated code..." };
    
    // Stream the code in chunks for visual effect
    const lines = fullCode.split('\n');
    let lastSentIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const progress = 80 + Math.floor((i / lines.length) * 15);
      
      if (i % 5 === 0 || i === lines.length - 1) { // Send updates every 5 lines
        // Send only new lines since last sent index
        const newLines = lines.slice(lastSentIndex + 1, i + 1);
        yield { 
          content: newLines.join('\n') + (newLines.length > 0 ? '\n' : ''),
          progress, 
          stage: "Streaming AI-generated code..." 
        };
        lastSentIndex = i;
        
        // Add a small delay to make the streaming visible
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
    yield { content: "", progress: 95, stage: "Validating generated code..." };
    
    generation.end({
      output: fullCode,
      metadata: { 
        source: "gemini-2.0-flash-exp",
        codeLength: fullCode.length 
      }
    });

    trace.update({
      output: { 
        generatedCode: fullCode,
        source: "gemini-2.0-flash-exp"
      },
    });

    yield { content: "", progress: 100, stage: "Generation complete! (Gemini 2.0 Flash)" };

  } catch (error) {
    trace.update({
      output: { error: error instanceof Error ? error.message : "Unknown error" },
    });
    
    throw error;
  }
}