export interface CodeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export async function validateTypeScriptCode(code: string): Promise<CodeValidationResult> {
  const result: CodeValidationResult = {
    isValid: true,
    errors: [],
    warnings: [],
  };

  try {
    // Simplified validation that works in all environments
    // Focus on security and structure checks without TypeScript compiler
    
    // Security checks
    const securityValidation = performSecurityChecks(code);
    if (!securityValidation.isValid) {
      result.isValid = false;
      result.errors.push(...securityValidation.errors);
    }

    // Structure validation
    const structureValidation = validateComponentStructure(code);
    if (!structureValidation.isValid) {
      result.isValid = false;
      result.errors.push(...structureValidation.errors);
    }

    // Basic syntax checks
    const syntaxValidation = performBasicSyntaxChecks(code);
    if (!syntaxValidation.isValid) {
      result.isValid = false;
      result.errors.push(...syntaxValidation.errors);
    }

  } catch (error) {
    result.isValid = false;
    result.errors.push(`Validation error: ${error instanceof Error ? error.message : "Unknown error"}`);
  }

  return result;
}

function performSecurityChecks(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for dangerous patterns
  const dangerousPatterns = [
    /dangerouslySetInnerHTML/,
    /eval\s*\(/,
    /Function\s*\(/,
    /document\.write/,
    /window\.location/,
    /localStorage\./,
    /sessionStorage\./,
    /fetch\(/,
    /XMLHttpRequest/,
    /import\s+.*from\s+['"](?!react)/,
  ];

  dangerousPatterns.forEach((pattern, index) => {
    if (pattern.test(code)) {
      const patternNames = [
        "dangerouslySetInnerHTML",
        "eval function",
        "Function constructor",
        "document.write",
        "window.location",
        "localStorage access",
        "sessionStorage access",
        "fetch API",
        "XMLHttpRequest",
        "external imports"
      ];
      errors.push(`Dangerous pattern detected: ${patternNames[index]}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function validateComponentStructure(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // For react-live format, check for function declaration (no exports needed)
  if (!code.includes("function GeneratedLesson")) {
    errors.push("Component must have a 'function GeneratedLesson()' declaration");
  }

  // Check for render call at the end (react-live requirement)
  if (!code.includes("render(<GeneratedLesson")) {
    errors.push("Component must end with 'render(<GeneratedLesson />)' for react-live compatibility");
  }

  // Check for JSX return
  if (!code.includes("return") || !code.includes("<")) {
    errors.push("Component must return JSX");
  }

  // Validate react-live specific patterns
  if (code.includes("export default") || code.includes("export {")) {
    errors.push("React-live components should not have export statements");
  }

  if (code.includes("import ")) {
    errors.push("React-live components should not have import statements");
  }

  // Check for proper function structure
  const functionMatch = code.match(/function GeneratedLesson\(\s*\)\s*\{/);
  if (!functionMatch) {
    errors.push("Function must be declared as 'function GeneratedLesson() {'");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

function performBasicSyntaxChecks(code: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check for common JSX syntax errors
  if (code.includes('<inputype=')) {
    errors.push('JSX syntax error: <inputype= should be <input type=');
  }
  
  if (code.includes('<buttonClick=')) {
    errors.push('JSX syntax error: <buttonClick= should be <button onClick=');
  }
  
  if (code.includes('className="borderounded"')) {
    errors.push('CSS class error: "borderounded" should be "border rounded"');
  }
  
  if (code.includes('className="roundedisabled"')) {
    errors.push('CSS class error: "roundedisabled" should be "rounded disabled"');
  }
  
  if (code.includes('ononClick=')) {
    errors.push('JSX syntax error: "ononClick=" should be "onClick="');
  }
  
  if (code.includes('onOnClick=')) {
    errors.push('JSX syntax error: "onOnClick=" should be "onClick="');
  }
  
  if (code.includes('setAnswer(') && !code.includes('setUserAnswer(')) {
    errors.push('Variable name error: "setAnswer" should probably be "setUserAnswer"');
  }
  
  // Check for orphaned SVG elements
  if (code.includes('<rect ') && !code.includes('<svg')) {
    errors.push('SVG elements found without svg container');
  }
  
  // Check for incomplete function definitions ending with } else {
  if (code.includes('} else {\n  };')) {
    errors.push('Incomplete function with empty else block');
  }
  
  // Check for missing closing tags in conditional rendering
  const ifBlocks = code.match(/if\s*\([^)]*\)\s*\{[^}]*\}/g);
  if (ifBlocks) {
    ifBlocks.forEach(block => {
      if (block.includes('} else {') && !block.includes('} else {\n')) {
        errors.push('Incomplete if/else statement structure');
      }
    });
  }

  // Check for empty function bodies
  const emptyFunctionPattern = /const\s+\w+\s*=\s*\(\)\s*=>\s*\{\s*\};/g;
  if (emptyFunctionPattern.test(code)) {
    errors.push('Empty function bodies are not allowed');
  }

  // Check for incomplete if/else statements
  const incompleteIfPattern = /if\s*\([^)]*\)\s*\{\s*\}\s*else\s*\{\s*$/gm;
  if (incompleteIfPattern.test(code)) {
    errors.push('Incomplete if/else statements detected');
  }

  // Check for balanced brackets
  const brackets = { '(': ')', '[': ']', '{': '}' };
  const stack: string[] = [];
  let inString = false;
  let inComment = false;
  let stringChar = '';

  for (let i = 0; i < code.length; i++) {
    const char = code[i];
    const nextChar = code[i + 1];

    // Handle string literals
    if ((char === '"' || char === "'" || char === '`') && !inComment) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar && code[i - 1] !== '\\') {
        inString = false;
        stringChar = '';
      }
      continue;
    }

    // Handle comments
    if (!inString) {
      if (char === '/' && nextChar === '/') {
        inComment = true;
        continue;
      }
      if (char === '\n') {
        inComment = false;
        continue;
      }
      if (inComment) continue;
    }

    // Check brackets only outside strings and comments
    if (!inString && !inComment) {
      if (Object.keys(brackets).includes(char)) {
        stack.push(char);
      } else if (Object.values(brackets).includes(char)) {
        if (stack.length === 0) {
          errors.push(`Unmatched closing bracket: ${char}`);
        } else {
          const lastOpening = stack.pop()!;
          if (brackets[lastOpening as keyof typeof brackets] !== char) {
            errors.push(`Mismatched brackets: ${lastOpening} and ${char}`);
          }
        }
      }
    }
  }

  if (stack.length > 0) {
    errors.push(`Unmatched opening brackets: ${stack.join(', ')}`);
  }

  // Check for react-live specific function declaration
  if (!code.includes('function GeneratedLesson')) {
    errors.push('Must contain "function GeneratedLesson" declaration');
  }

  // Check for JSX return
  if (!code.includes('return') || (!code.includes('<') && !code.includes('>'))) {
    errors.push('Component must return JSX');
  }

  // Ensure proper react-live ending
  if (!code.includes('render(<GeneratedLesson')) {
    errors.push('Must end with render(<GeneratedLesson />) call');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}