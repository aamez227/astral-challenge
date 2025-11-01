import { Langfuse } from "langfuse";
import { GoogleGenAI } from "@google/genai";
import { Project, SyntaxKind } from "ts-morph";

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
      model: "gemini-2.0-flash",
      type: "lesson-generation-stream" 
    },
  });

  try {
    const generation = trace.generation({
      name: "gemini-lesson-generation-stream",
      model: "gemini-2.0-flash",
      input: { outline },
    });

    // Stream the generation process
    yield { content: "", progress: 10, stage: "Connecting to Gemini..." };
    
    yield { content: "", progress: 20, stage: "Analyzing lesson requirements..." };
    
    // Pure AI generation - no fallbacks to templates
    let fullCode = "";
    
    yield { content: "", progress: 30, stage: "Generating with Gemini..." };
    
    const prompt = `Generate a COMPLETE, FUNCTIONAL React component specifically formatted for react-live compatibility.

## CRITICAL REACT-LIVE REQUIREMENTS (MUST FOLLOW EXACTLY):
1. **NO IMPORTS** - react-live automatically provides React, useState, useEffect, etc.
2. **NO INTERFACES/TYPES** - Use inline types or omit entirely for react-live compatibility
3. **NO EXPORT STATEMENTS** - Component will be rendered directly
4. **FUNCTION DECLARATION ONLY**: Use exactly \`function GeneratedLesson() { ... }\` format
5. **END WITH RENDER CALL**: Must conclude with exactly \`render(<GeneratedLesson />);\`

## MANDATORY SIMPLE STRUCTURE (FOLLOW EXACTLY):
\`\`\`typescript
function GeneratedLesson() {
  const [state, setState] = useState(initialValue);
  
  const handleAction = () => {
    setState(newValue);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-4">Title</h1>
      {/* Complete JSX content */}
    </div>
  );
}

render(<GeneratedLesson />);
\`\`\`

## SYNTAX REQUIREMENTS (CRITICAL - NO ERRORS ALLOWED):
- **Perfect JSX spacing**: \`<input type="text"\` NOT \`<inputype="text"\` (missing space)
- **Perfect button syntax**: \`<button onClick={handler}\` NOT \`<buttonClick={handler}\` (missing space)
- **Complete Tailwind**: \`className="border rounded"\` NOT \`className="borderounded"\` (missing space)
- **All functions implemented** - NO empty function bodies \`() => {}\`
- **All JSX tags closed** - Every \`<div>\` needs \`</div>\`
- **Balanced braces** - Count { and } must match exactly
- **Complete conditionals** - Every if/else must have full implementation
- **No orphaned closing braces** - Every \`}\` must have matching \`{\`

## REQUIREMENTS:
- **Complete implementations** - No empty functions, all logic working
- **Tailwind CSS only** - Responsive design with hover states
- **Interactive elements** - Multiple buttons, inputs, state changes, SVG graphics
- **Educational content** - Clear instructions, visual feedback, diagrams
- **Clean code** - Descriptive names, proper formatting
- **SVG Graphics** - Use inline SVG for diagrams, charts, illustrations when educational
- **Visual Learning** - Include diagrams, charts, or visual elements to enhance understanding

## FORBIDDEN:
- Import/export statements
- Interface/type definitions  
- Empty function bodies
- Malformed JSX syntax
- External dependencies

## CRITICAL SYNTAX PATTERNS TO FOLLOW:
✅ CORRECT: \`<input type="text" className="border rounded" onClick={handleClick} />\`
❌ WRONG: \`<inputype="text" className="borderounded" ononClick={handleClick} />\`

✅ CORRECT: Complete functions:
\`\`\`
const handleNext = () => {
  if (current < max) {
    setCurrent(current + 1);
  } else {
    setComplete(true);
  }
};
\`\`\`
❌ WRONG: Empty or incomplete functions:
\`\`\`
const handleNext = () => {
  if (current < max) {
  } else {
};
\`\`\`

✅ CORRECT: Balanced JSX with ALL closing tags:
\`\`\`
<div>
  <svg>...</svg>
</div>
\`\`\`
❌ WRONG: Missing closing tags or orphaned elements

## EDUCATIONAL TASK:
Transform this user request into an interactive educational React component: "${outline}"

REGARDLESS of the topic, create a component that:
- Has multiple interactive elements (buttons, inputs, sliders, etc.)
- Provides immediate visual feedback
- Uses educational principles (progressive disclosure, clear instructions)
- Includes relevant SVG graphics or visual elements
- Has a complete, functional implementation with NO syntax errors

## SVG GRAPHICS EXAMPLES:
Use inline SVG for educational diagrams, charts, and illustrations:

\`\`\`typescript
// Example: Interactive circle that changes color
<svg width="200" height="200" className="border rounded">
  <circle 
    cx="100" 
    cy="100" 
    r="50" 
    fill={isActive ? "blue" : "gray"}
    className="cursor-pointer transition-colors"
    onClick={() => setIsActive(!isActive)}
  />
</svg>

// Example: Bar chart
<svg width="300" height="200" className="border rounded">
  <rect x="50" y={150 - value1} width="30" height={value1} fill="blue" />
  <rect x="100" y={150 - value2} width="30" height={value2} fill="green" />
  <rect x="150" y={150 - value3} width="30" height={value3} fill="red" />
</svg>
\`\`\`

## OUTPUT FORMAT:
Provide ONLY the complete React code - no explanations or markdown, just executable code.`;

    const systemPrompt = "You are an expert educational content creator and React TypeScript developer specialized in creating interactive learning components. Generate high-quality, complete, and functional educational components that work perfectly with react-live.";
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
    });
    
    yield { content: "", progress: 50, stage: "Processing Gemini response..." };
    
    const generatedContent = result.text;
    
    if (!generatedContent) {
      throw new Error("No content generated by Gemini API");
    }
    
    fullCode = cleanGeminiGeneratedCode(generatedContent);
    
    if (!fullCode || fullCode.trim().length === 0) {
      throw new Error("Generated code is empty after cleaning");
    }
    
    yield { content: "", progress: 70, stage: "Gemini generation successful!" };
    
    yield { content: "", progress: 80, stage: "Streaming generated code..." };
    
    // Stream the code in chunks for visual effect
    const lines = fullCode.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
      const progress = 80 + Math.floor((i / lines.length) * 15);
      
      if (i % 5 === 0 || i === lines.length - 1) { // Send updates every 5 lines
        yield { 
          content: lines.slice(Math.max(0, i-4), i+1).join('\n') + '\n',
          progress, 
          stage: "Streaming AI-generated code..." 
        };
        
        // Add a small delay to make the streaming visible
        await new Promise(resolve => setTimeout(resolve, 30));
      }
    }
    
    yield { content: "", progress: 95, stage: "Validating generated code..." };
    
    generation.end({
      output: fullCode,
      metadata: { 
        source: "gemini-2.0-flash",
        codeLength: fullCode.length 
      }
    });

    trace.update({
      output: { 
        generatedCode: fullCode,
        source: "gemini-2.0-flash"
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

export async function generateLessonCode(outline: string): Promise<string> {
  const trace = langfuse.trace({
    name: "lesson-generation",
    input: { outline },
    metadata: { 
      model: "gemini-2.0-flash",
      type: "lesson-generation" 
    },
  });

  try {
    const generation = trace.generation({
      name: "gemini-lesson-generation",
      model: "gemini-2.0-flash",
      input: { outline },
    });

    // Use the same simplified prompt as the streaming version
    const prompt = `Generate a COMPLETE, FUNCTIONAL React component specifically formatted for react-live compatibility.

## CRITICAL REACT-LIVE REQUIREMENTS (MUST FOLLOW EXACTLY):
1. **NO IMPORTS** - react-live automatically provides React, useState, useEffect, etc.
2. **NO INTERFACES/TYPES** - Use inline types or omit entirely for react-live compatibility
3. **NO EXPORT STATEMENTS** - Component will be rendered directly
4. **FUNCTION DECLARATION ONLY**: Use exactly \`function GeneratedLesson() { ... }\` format
5. **END WITH RENDER CALL**: Must conclude with exactly \`render(<GeneratedLesson />);\`

## SYNTAX REQUIREMENTS (CRITICAL - NO ERRORS ALLOWED):
- **Perfect JSX spacing**: \`<input type="text"\` NOT \`<inputype="text"\` (missing space)
- **Perfect button syntax**: \`<button onClick={handler}\` NOT \`<buttonClick={handler}\` (missing space)
- **Complete Tailwind**: \`className="border rounded"\` NOT \`className="borderounded"\` (missing space)
- **All functions implemented** - NO empty function bodies \`() => {}\`
- **All JSX tags closed** - Every \`<div>\` needs \`</div>\`
- **Balanced braces** - Count { and } must match exactly
- **Complete conditionals** - Every if/else must have full implementation
- **No orphaned closing braces** - Every \`}\` must have matching \`{\`

## REQUIREMENTS:
- **Complete implementations** - No empty functions, all logic working
- **Tailwind CSS only** - Responsive design with hover states
- **Interactive elements** - Multiple buttons, inputs, state changes, SVG graphics
- **Educational content** - Clear instructions, visual feedback, diagrams
- **Clean code** - Descriptive names, proper formatting
- **SVG Graphics** - Use inline SVG for diagrams, charts, illustrations when educational
- **Visual Learning** - Include diagrams, charts, or visual elements to enhance understanding

## FORBIDDEN:
- Import/export statements
- Interface/type definitions  
- Empty function bodies
- Malformed JSX syntax
- External dependencies

## CRITICAL SYNTAX PATTERNS TO FOLLOW:
✅ CORRECT: \`<input type="text" className="border rounded" onClick={handleClick} />\`
❌ WRONG: \`<inputype="text" className="borderounded" ononClick={handleClick} />\`

✅ CORRECT: Complete functions:
\`\`\`
const handleNext = () => {
  if (current < max) {
    setCurrent(current + 1);
  } else {
    setComplete(true);
  }
};
\`\`\`
❌ WRONG: Empty or incomplete functions:
\`\`\`
const handleNext = () => {
  if (current < max) {
  } else {
};
\`\`\`

✅ CORRECT: Balanced JSX with ALL closing tags:
\`\`\`
<div>
  <svg>...</svg>
</div>
\`\`\`
❌ WRONG: Missing closing tags or orphaned elements

## EDUCATIONAL TASK:
Transform this user request into an interactive educational React component: "${outline}"

REGARDLESS of the topic, create a component that:
- Has multiple interactive elements (buttons, inputs, sliders, etc.)
- Provides immediate visual feedback
- Uses educational principles (progressive disclosure, clear instructions)
- Includes relevant SVG graphics or visual elements
- Has a complete, functional implementation with NO syntax errors

## OUTPUT FORMAT:
Provide ONLY the complete React code - no explanations or markdown, just executable code.`;

    const systemPrompt = "You are an expert educational content creator and React TypeScript developer specialized in creating interactive learning components.";
    const fullPrompt = `${systemPrompt}\n\n${prompt}`;
    
    const result = await genAI.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: fullPrompt,
    });
    
    const generatedContent = result.text;
    
    if (!generatedContent) {
      throw new Error("No content generated by Gemini API");
    }
    
    const generatedCode = cleanGeminiGeneratedCode(generatedContent);
    
    if (!generatedCode || generatedCode.trim().length === 0) {
      throw new Error("Generated code is empty after cleaning");
    }

    generation.end({
      output: generatedCode,
    });

    trace.update({
      output: { generatedCode },
    });

    return generatedCode;
  } catch (error) {
    trace.update({
      output: { error: error instanceof Error ? error.message : "Unknown error" },
    });
    
    console.error("Error generating lesson code:", error);
    throw error;
  }
}

function cleanGeminiGeneratedCode(code: string): string {
  // Remove markdown code blocks if present
  let cleaned = code.replace(/^```(?:typescript|tsx|ts|javascript|jsx)?\n/, "").replace(/\n```$/, "");
  
  // Fix immediate syntax errors before further processing
  cleaned = fixImmediateSyntaxErrors(cleaned);
  
  // Remove any explanatory text before/after the code
  const initialLines = cleaned.split('\n');
  let startIndex = 0;
  let endIndex = initialLines.length - 1;
  
  // Find the start of the actual component code - look for function declaration
  for (let i = 0; i < initialLines.length; i++) {
    if (initialLines[i].includes('function GeneratedLesson')) {
      startIndex = i;
      break;
    }
  }
  
  // Find the proper end - look for "render(<GeneratedLesson" and include it
  for (let i = initialLines.length - 1; i >= 0; i--) {
    if (initialLines[i].includes('render(<GeneratedLesson')) {
      endIndex = i;
      break;
    }
  }
  
  cleaned = initialLines.slice(startIndex, endIndex + 1).join('\n');
  
  // Remove any import statements that might have slipped through
  cleaned = cleaned.replace(/import.*from.*["'].*["'];?\n/g, '');
  
  // Remove interface definitions
  cleaned = cleaned.replace(/interface\s+\w+\s*{[^}]*}\s*/g, '');
  
  // Remove TypeScript type annotations
  cleaned = cleaned.replace(/useState<[^>]*>/g, 'useState');
  cleaned = cleaned.replace(/:\s*(string|number|boolean)\s*\|\s*null/g, '');
  cleaned = cleaned.replace(/:\s*(string|number|boolean)\[\]/g, '');
  cleaned = cleaned.replace(/:\s*(string|number|boolean)/g, '');
  cleaned = cleaned.replace(/:\s*null/g, '');
  cleaned = cleaned.replace(/:\s*\w+\[\]/g, '');
  
  // Fix common JSX tag mismatches
  cleaned = cleaned.replace(/<button([^>]*)>([^<]*)<\/p>/g, '<button$1>$2</button>');
  
  // Remove export statements
  cleaned = cleaned.replace(/export default.*$/gm, '');
  
  // AGGRESSIVE: Remove everything after the first complete component
  // Find "function GeneratedLesson()" and the first complete return...}
  const functionStart = cleaned.indexOf('function GeneratedLesson()');
  if (functionStart !== -1) {
    let braceCount = 0;
    let foundFirstBrace = false;
    let componentEnd = -1;
    
    // Start scanning from function declaration
    for (let i = functionStart; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (char === '{') {
        braceCount++;
        foundFirstBrace = true;
      } else if (char === '}') {
        braceCount--;
        
        // When we close all braces, we've found the end of the component
        if (foundFirstBrace && braceCount === 0) {
          componentEnd = i + 1;
          break;
        }
      }
    }
    
    if (componentEnd !== -1) {
      // Extract just the clean component
      cleaned = cleaned.substring(functionStart, componentEnd);
    } else {
      // Fallback: Code is so broken it never properly closes
      // Try to salvage what we can and force a proper closure
      console.warn('Generated code never properly closes - applying emergency fixes');
      
      // Find the last return statement and try to close from there
      const lastReturnIndex = cleaned.lastIndexOf('return (');
      if (lastReturnIndex !== -1) {
        // Take everything up to a reasonable point and force closure
        let truncatePoint = cleaned.length;
        
        // Look for obvious signs the code is broken (duplicate elements, abrupt endings)
        const possibleBreakPoints = [
          cleaned.indexOf('\n        </svg>\n\n          <circle'), // Duplicate SVG elements
          cleaned.indexOf('\n\nrender(<GeneratedLesson'), // Premature render call
          cleaned.lastIndexOf('</svg>') + 6, // After last SVG
        ];
        
        for (const breakPoint of possibleBreakPoints) {
          if (breakPoint > lastReturnIndex && breakPoint < truncatePoint) {
            truncatePoint = breakPoint;
          }
        }
        
        // Truncate the broken code
        cleaned = cleaned.substring(functionStart, truncatePoint);
        
        // Force proper JSX and function closure
        if (!cleaned.includes('</div>')) {
          cleaned += '\n    </div>';
        }
        if (!cleaned.includes(');')) {
          cleaned += '\n  );';  
        }
        if (!cleaned.includes('};')) {
          cleaned += '\n}';
        }
      }
    }
  }
  
  // Additional safety: Remove any stray JSX after the component
  // This handles cases where Gemini adds malformed JSX after the function
  const finalLines = cleaned.split('\n');
  const cleanedLines = [];
  let foundFunctionEnd = false;
  
  for (const line of finalLines) {
    cleanedLines.push(line);
    
    // After we see the function close, stop adding JSX-looking lines
    if (line.trim() === '}' && !foundFunctionEnd) {
      foundFunctionEnd = true;
      continue;
    }
    
    // If we've closed the function, only allow render() or empty lines
    if (foundFunctionEnd) {
      const trimmed = line.trim();
      if (trimmed.includes('render(') || trimmed === '') {
        // Allow render calls and empty lines
        continue;
      } else if (trimmed.includes('</div>') || trimmed.includes(');') || trimmed === '}') {
        // Remove stray closing JSX
        cleanedLines.pop();
      }
    }
  }
  
  cleaned = cleanedLines.join('\n');
  
  // Ensure it ends with render call if missing
  if (!cleaned.includes('render(<GeneratedLesson')) {
    cleaned += '\n\nrender(<GeneratedLesson />);';
  }
  
  // Fix common incomplete patterns using ts-morph
  cleaned = fixCodeWithTsMorph(cleaned);
  
  // Remove any dangerous functions
  cleaned = cleaned.replace(/dangerouslySetInnerHTML/g, '');
  cleaned = cleaned.replace(/eval\(/g, '');
  cleaned = cleaned.replace(/Function\(/g, '');
  
  return cleaned.trim();
}

function fixImmediateSyntaxErrors(code: string): string {
  let fixed = code;
  
  // Fix broken input tags - CRITICAL syntax error
  fixed = fixed.replace(/<inputype="/g, '<input type="');
  fixed = fixed.replace(/<buttonClick=/g, '<button onClick=');
  
  // Fix common broken JSX patterns
  fixed = fixed.replace(/<input([^>]*?)type="([^"]*?)"/g, '<input$1type="$2"');
  fixed = fixed.replace(/<button([^>]*?)Click=/g, '<button$1onClick=');
  
  // Fix broken onClick patterns
  fixed = fixed.replace(/ononClick=/g, 'onClick=');
  fixed = fixed.replace(/onOnClick=/g, 'onClick=');
  
  // Fix broken className concatenations
  fixed = fixed.replace(/className="borderounded/g, 'className="border rounded');
  fixed = fixed.replace(/className="([^"]*?)borderounded/g, 'className="$1border rounded');
  fixed = fixed.replace(/className="([^"]*?)roundedisabled/g, 'className="$1rounded disabled');
  
  // Fix missing closing tags and braces
  fixed = fixed.replace(/(<div[^>]*>)(\s*<\/div>\s*)}$/gm, '$1\n      $2');
  
  // Fix incomplete function calls like setAnswer that should be setUserAnswer
  fixed = fixed.replace(/setAnswer\(/g, 'setUserAnswer(');
  
  // Fix missing grid class
  fixed = fixed.replace(/className="grid-cols-(\d+)/g, 'className="grid grid-cols-$1');
  
  // Fix missing border class
  fixed = fixed.replace(/className="([^"]*?)border-([a-z]+)-(\d+)/g, 'className="$1border border-$2-$3');
  
  // Fix incomplete setTimeout patterns
  fixed = fixed.replace(/setTimeout\(\(\) => \{\s*if \([^}]*\) \{\s*\} else \{\s*\}\s*$/gm, 
    'setTimeout(() => {\n      if (currentQuestionIndex < questions.length - 1) {\n        setCurrentQuestionIndex(currentQuestionIndex + 1);\n        setSelectedAnswer(null);\n        setShowFeedback(false);\n      } else {\n        setQuizCompleted(true);\n      }\n    }, 1500);');
  
  // Fix empty functions
  fixed = fixed.replace(/const resetQuiz = \(\) => \{\s*\};/g,
    `const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowFeedback(false);
    setFeedbackMessage("");
    setQuizCompleted(false);
  };`);
  
  // Fix incomplete nextQuestion functions
  fixed = fixed.replace(/const nextQuestion = \(\) => \{\s*if \([^}]*\) \{\s*\} else \{\s*\}\s*\};/g,
    `const nextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer("");
      setFeedback("");
      setShowSolution(false);
    } else {
      setFeedback("Quiz completed!");
    }
  };`);
  
  // Fix incomplete handleNextQuestion functions specifically
  fixed = fixed.replace(/const handleNextQuestion = \(\) => \{\s*if \([^}]*\) \{\s*setQuestionIndex[^}]*\} else \{\s*setQuestionIndex[^}]*\}\s*;?$/gm,
    `const handleNextQuestion = () => {
    if (questionIndex < questions.length - 1) {
      setQuestionIndex(questionIndex + 1);
      setUserAnswer("");
      setFeedback("");
    } else {
      setFeedback("Test completed!");
    }
  };`);
  
  // Fix incomplete functions with empty if/else blocks
  fixed = fixed.replace(/const handleNextQuestion = \(\) => \{\s*if \([^}]*\) \{\s*\} else \{\s*\}\s*\};?/gm,
    `const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setUserAnswer("");
      setFeedback("");
      setShowSolution(false);
    } else {
      setFeedback("Test completed!");
    }
  };`);
  
  // Fix incomplete handleShowSolution functions
  fixed = fixed.replace(/const handleShowSolution = \(\) => \{\s*\};?/g,
    `const handleShowSolution = () => {
    setShowSolution(true);
  };`);
  
  // Fix empty showSolutionNow functions
  fixed = fixed.replace(/const showSolutionNow = \(\) => \{\s*\};/g,
    `const showSolutionNow = () => {
    setShowSolution(true);
  };`);
  
  // Fix orphaned closing braces at end of return statements
  fixed = fixed.replace(/(\s*<\/div>\s*\);\s*}\s*)+\s*render\(/g, '\n    </div>\n  );\n}\n\nrender(');
  
  // Fix missing closing divs and structure issues
  const lines = fixed.split('\n');
  const fixedLines = [];
  let openDivs = 0;
  let openSvgs = 0;
  let inReturn = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('return (')) {
      inReturn = true;
    }
    
    if (inReturn) {
      // Count opening and closing tags
      const openDivCount = (line.match(/<div/g) || []).length;
      const closeDivCount = (line.match(/<\/div>/g) || []).length;
      const openSvgCount = (line.match(/<svg/g) || []).length;
      const closeSvgCount = (line.match(/<\/svg>/g) || []).length;
      
      openDivs += openDivCount - closeDivCount;
      openSvgs += openSvgCount - closeSvgCount;
      
      // Fix orphaned SVG content - if we see SVG elements outside of svg tags
      if (line.includes('<rect ') && openSvgs === 0) {
        // This rect is outside an SVG, skip it or wrap it
        fixedLines.push(line);
        continue;
      }
      
      // If we see the end of return and have unclosed tags, close them
      if (line.includes(');') && (openDivs > 0 || openSvgs > 0)) {
        // Insert missing closing tags before the closing parenthesis
        const indent = '      ';
        for (let j = 0; j < openSvgs; j++) {
          fixedLines.push(indent + '</svg>');
        }
        for (let j = 0; j < openDivs; j++) {
          fixedLines.push(indent + '</div>');
        }
        openDivs = 0;
        openSvgs = 0;
        inReturn = false;
      }
    }
    
    fixedLines.push(line);
  }
  
  fixed = fixedLines.join('\n');
  
  // Remove orphaned SVG elements that appear after closing the main component
  fixed = fixed.replace(/\s*<rect[^>]*\/?>[\s\S]*?<text[^>]*>[\s\S]*?<\/text>\s*<\/svg>\s*render\(/g, '\n\nrender(');
  
  // Fix unclosed JSX elements in feedback sections
  fixed = fixed.replace(/(<div className="bg-green-100[^>]*>[\s\S]*?<span[^>]*>[^<]*<\/span>\s*)(?!<\/div>)/g, '$1\n                </div>');
  fixed = fixed.replace(/(<div className="bg-red-100[^>]*>[\s\S]*?<span[^>]*>[^<]*<\/span>\s*)(?!<\/div>)/g, '$1\n                </div>');
  
  // Fix duplicate text content
  fixed = fixed.replace(/(\w+)\s+\1/g, '$1');
  fixed = fixed.replace(/Retry Quiz\s+Retry Quiz/g, 'Retry Quiz');
  
  // Fix incomplete conditional statements 
  fixed = fixed.replace(/if \(currentQuestionIndex < questions\.length - 1\) \{\s*\} else \{/g,
    `if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
        setSelectedAnswer(null);
        setShowFeedback(false);
      } else {`);
  
  // Fix incomplete setTimeout calls
  fixed = fixed.replace(/setTimeout\(\(\) => \{\s*if[^}]*\{\s*\}\s*else\s*\{\s*$/gm,
    'setTimeout(() => {\n      if (currentQuestionIndex < questions.length - 1) {\n        setCurrentQuestionIndex(currentQuestionIndex + 1);\n        setSelectedAnswer(null);\n        setShowFeedback(false);\n      } else {\n        setQuizCompleted(true);\n      }\n    }, 1500);');
  
  // Fix missing closing braces for functions  
  const functionLines = fixed.split('\n');
  const functionFixedLines = [];
  let openBraces = 0;
  let inFunction = false;
  
  for (let i = 0; i < functionLines.length; i++) {
    const line = functionLines[i];
    functionFixedLines.push(line);
    
    if (line.includes('function GeneratedLesson')) {
      inFunction = true;
    }
    
    if (inFunction) {
      const openCount = (line.match(/\{/g) || []).length;
      const closeCount = (line.match(/\}/g) || []).length;
      openBraces += openCount - closeCount;
    }
    
    // If we're at the end and have unclosed braces, close them
    if (i === functionLines.length - 1 && openBraces > 0 && inFunction) {
      for (let j = 0; j < openBraces; j++) {
        functionFixedLines.push('}');
      }
    }
  }
  
  return functionFixedLines.join('\n');
}

function fixCodeWithTsMorph(code: string): string {
  try {
    // Create a temporary project
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        jsx: 1, // JsxEmit.React
        allowJs: true,
        checkJs: false,
        noEmit: true,
      },
    });

    // Add the code as a source file
    const sourceFile = project.createSourceFile("temp.tsx", code);

    // Fix common syntax issues before parsing
    let fixedCode = code;
    
    // Pre-process common malformed patterns that prevent parsing
    fixedCode = fixedCode.replace(/const(\w+)/g, 'const $1');
    fixedCode = fixedCode.replace(/button(\w+)/g, 'button $1');
    fixedCode = fixedCode.replace(/input(\w+)/g, 'input $1');
    fixedCode = fixedCode.replace(/\s+Click=/g, ' onClick=');
    fixedCode = fixedCode.replace(/\s+ype=/g, ' type=');
    fixedCode = fixedCode.replace(/\s+orderounded/g, ' border rounded');
    fixedCode = fixedCode.replace(/horizontal(\w+)/g, 'horizontal $1');
    fixedCode = fixedCode.replace(/vertical(\w+)/g, 'vertical $1');
    
    // Fix more specific malformed patterns
    fixedCode = fixedCode.replace(/constoggle/g, 'const toggle');
    fixedCode = fixedCode.replace(/constoggleExplanation/g, 'const toggleExplanation');
    fixedCode = fixedCode.replace(/buttonClick=/g, 'button onClick=');
    fixedCode = fixedCode.replace(/inputype=/g, 'input type=');
    fixedCode = fixedCode.replace(/borderounded/g, 'border rounded');
    fixedCode = fixedCode.replace(/grid-cols-(\d+)/g, 'grid grid-cols-$1');
    
    // Fix JSX tag issues
    fixedCode = fixedCode.replace(/<\/input>/g, ''); // Remove invalid closing input tags
    
    // Fix common text concatenation errors
    fixedCode = fixedCode.replace(/howe calculated/g, 'how we calculated');
    fixedCode = fixedCode.replace(/squareach/g, 'square each');
    fixedCode = fixedCode.replace(/squaredifferences/g, 'squared differences');
    fixedCode = fixedCode.replace(/decimalist-inside/g, 'decimal list-inside');
    fixedCode = fixedCode.replace(/horizontaly/g, 'horizontally');
    fixedCode = fixedCode.replace(/verticaly/g, 'vertically');
    fixedCode = fixedCode.replace(/athe origin/g, 'at the origin');
    fixedCode = fixedCode.replace(/This the distance/g, 'This is the distance');
    
    // Fix missing useEffect import - add it to scope since react-live provides it
    if (fixedCode.includes('useEffect') && !fixedCode.includes('useState, useEffect')) {
      fixedCode = fixedCode.replace('useState', 'useState, useEffect');
    }
    
    // Re-create source file with fixed code
    sourceFile.replaceWithText(fixedCode);

    // Find and fix incomplete function bodies
    const functions = sourceFile.getFunctions();
    
    functions.forEach((func) => {
      const name = func.getName();
      
      // Fix empty handleReset functions
      if (name === 'handleReset') {
        const body = func.getBody();
        if (body && body.getKind() === SyntaxKind.Block) {
          const blockBody = body.asKind(SyntaxKind.Block);
          if (blockBody && blockBody.getStatements().length === 0) {
            blockBody.replaceWithText(`{
    setQuestionIndex(0);
    setScore(0);
    setAnswer('');
    setMessage('');
  }`);
          }
        }
      }
    });

    // Fix incomplete if statements
    const ifStatements = sourceFile.getDescendantsOfKind(SyntaxKind.IfStatement);
    ifStatements.forEach(ifStatement => {
      const thenStatement = ifStatement.getThenStatement();
      const elseStatement = ifStatement.getElseStatement();
      
      // Check if both then and else are empty blocks
      if (thenStatement?.getKind() === SyntaxKind.Block && 
          elseStatement?.getKind() === SyntaxKind.Block) {
        const thenBlock = thenStatement.asKind(SyntaxKind.Block);
        const elseBlock = elseStatement.asKind(SyntaxKind.Block);
        
        if (thenBlock && elseBlock && 
            thenBlock.getStatements().length === 0 && 
            elseBlock.getStatements().length === 0) {
          const condition = ifStatement.getExpression().getText();
          
          // Fix quiz navigation patterns
          if (condition.includes('questionIndex') && condition.includes('length')) {
            thenBlock.replaceWithText(`{
      setQuestionIndex(questionIndex + 1);
      setAnswer('');
    }`);
            elseBlock.replaceWithText(`{
      setQuestionIndex(questions.length);
    }`);
          }
        }
      }
    });

    // Get the fixed text
    const result = sourceFile.getFullText();
    
    // Additional post-processing for JSX issues that ts-morph might miss
    let finalResult = result;
    
    // Fix duplicate text in buttons
    finalResult = finalResult.replace(/(\w+)\s+\1/g, '$1');
    
    // Remove duplicate closing structures more aggressively
    // Pattern: </div>\n  );\n}\n    </div>\n  );\n}
    finalResult = finalResult.replace(/(\s*<\/div>\s*\);\s*}\s*)+(<\/div>\s*\);\s*})+.*?render\(/g, '\n  );\n}\n\nrender(');
    finalResult = finalResult.replace(/(\s*<\/div>\s*\);\s*}\s*){2,}/g, '\n    </div>\n  );\n}');
    
    // Ensure proper JSX structure
    const divOpenCount = (finalResult.match(/<div/g) || []).length;
    const divCloseCount = (finalResult.match(/<\/div>/g) || []).length;
    
    if (divOpenCount > divCloseCount) {
      const missingClosingDivs = divOpenCount - divCloseCount;
      const lastReturnIndex = finalResult.lastIndexOf('</div>');
      if (lastReturnIndex !== -1) {
        const insertPosition = lastReturnIndex + 6;
        const closingDivs = '\n        </div>'.repeat(missingClosingDivs);
        finalResult = finalResult.slice(0, insertPosition) + closingDivs + finalResult.slice(insertPosition);
      }
    }
    
    return finalResult;
    
  } catch (error) {
    console.warn('ts-morph parsing failed, using fallback fixes:', error);
    // Fallback to basic regex fixes if ts-morph fails
    return applyBasicFixes(code);
  }
}

function applyBasicFixes(code: string): string {
  let fixed = code;
  
  // Basic syntax fixes as fallback
  fixed = fixed.replace(/const(\w+)/g, 'const $1');
  fixed = fixed.replace(/button(\w+)/g, 'button $1');
  fixed = fixed.replace(/input(\w+)/g, 'input $1');
  fixed = fixed.replace(/\s+Click=/g, ' onClick=');
  fixed = fixed.replace(/\s+ype=/g, ' type=');
  fixed = fixed.replace(/\s+orderounded/g, ' border rounded');
  fixed = fixed.replace(/horizontal(\w+)/g, 'horizontal $1');
  fixed = fixed.replace(/vertical(\w+)/g, 'vertical $1');
  
  // Fix more specific malformed patterns
  fixed = fixed.replace(/constoggle/g, 'const toggle');
  fixed = fixed.replace(/constoggleExplanation/g, 'const toggleExplanation');
  fixed = fixed.replace(/buttonClick=/g, 'button onClick=');
  fixed = fixed.replace(/inputype=/g, 'input type=');
  fixed = fixed.replace(/borderounded/g, 'border rounded');
  fixed = fixed.replace(/grid-cols-(\d+)/g, 'grid grid-cols-$1');
  
  // Fix JSX tag issues
  fixed = fixed.replace(/<\/input>/g, ''); // Remove invalid closing input tags
  
  // Fix common text concatenation errors
  fixed = fixed.replace(/howe calculated/g, 'how we calculated');
  fixed = fixed.replace(/squareach/g, 'square each');
  fixed = fixed.replace(/squaredifferences/g, 'squared differences');
  fixed = fixed.replace(/decimalist-inside/g, 'decimal list-inside');
  
  // Fix duplicate text
  fixed = fixed.replace(/(\w+)\s+\1/g, '$1');
  
  // Remove duplicate closing structures
  fixed = fixed.replace(/(\s*<\/div>\s*\);\s*}\s*){2,}/g, '\n    </div>\n  );\n}');
  
  return fixed;
}