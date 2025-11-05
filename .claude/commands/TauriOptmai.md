# Tauri Application Optimization Prompt

## Overview
Systematically optimize Tauri applications by separately analyzing and optimizing the frontend (HTML/CSS/TypeScript) and backend (Rust) components.

## Execution Steps

### 1. Check and Create Optimization Documentation

First, follow these steps to verify documentation:

1. Check if a `docs` folder exists in the project root
2. Create the `docs` folder if it doesn't exist
3. Check/create the following files based on optimization target:
   - Frontend optimization: `docs/frontend-optimization.md`
   - Backend optimization: `docs/backend-optimization.md`
   - Other optimizations: `docs/{target-name}-optimization.md`

4. If the file already exists, read its contents to identify:
   - ✅ Optimized items
   - ⏳ Unoptimized items

### 2. Select Optimization Target

Confirm which part the user wants to optimize and use the corresponding documentation file.

### 3. Reference Latest Documentation

When performing optimizations, always reference the latest information:

- **Context7 Search**: Use Context7 to search library documentation when available
- **Web Search**: If Context7 is unavailable or information is insufficient, execute web_fetch to official documentation sites to retrieve the latest information
- Primary references:
  - Tauri Official Documentation: https://tauri.app/
  - Rust Official Documentation: https://doc.rust-lang.org/
  - Official site of the frontend framework being used

---

## Frontend Optimization Items (frontend-optimization.md)

### Performance Optimization
- [ ] Bundle size optimization
  - Enable tree shaking
  - Remove unused code
  - Utilize dynamic imports
- [ ] CSS optimization
  - Remove unused CSS
  - CSS minification
  - Extract critical CSS
- [ ] Image & asset optimization
  - Image compression
  - Use appropriate formats (WebP, etc.)
  - Implement lazy loading
- [ ] JavaScript optimization
  - Code splitting

### Rendering Optimization
- [ ] Virtual DOM efficiency (when using React/Vue, etc.)
- [ ] Prevent unnecessary re-renders
- [ ] Utilize memoization
- [ ] Leverage Web Workers (for heavy processing)

### TypeScript Optimization
- [ ] Type definition optimization
- [ ] Review compilation options
- [ ] Enable strict type checking
- [ ] Remove unnecessary type assertions

### Tauri-Specific Frontend Optimization
- [ ] IPC call optimization
  - Utilize batch processing
  - Reduce unnecessary IPC calls
- [ ] Proper event listener management
- [ ] Window size and memory usage optimization

---

## Backend Optimization Items (backend-optimization.md)

### Rust Code Optimization
- [ ] Perform performance profiling
- [ ] Remove unnecessary clones
- [ ] Optimize ownership and lifetimes
- [ ] Efficient use of iterators
- [ ] Utilize parallel processing (Rayon, etc.)
- [ ] Optimize asynchronous processing (Tokio)

### Memory Management
- [ ] Check for memory leaks
- [ ] Appropriate use of stack vs heap
- [ ] Proper use of Box
- [ ] Optimize reference counting (Rc/Arc)

### Compilation Optimization
- [ ] Set release build optimization level
  ```toml
  [profile.release]
  opt-level = "z"  # or s, 3
  lto = true
  codegen-units = 1
  strip = true
  ```
- [ ] Remove unnecessary dependencies
- [ ] Appropriate use of feature flags

### Tauri-Specific Backend Optimization
- [ ] Command handler optimization
- [ ] Efficient state management
- [ ] File system access optimization
- [ ] Database connection optimization (if applicable)
- [ ] Event emitter optimization

### Security Optimization
- [ ] Proper CSP configuration
- [ ] Review Tauri configuration (tauri.conf.json)
- [ ] Disable unnecessary APIs
- [ ] Strengthen input validation

---

## Optimization Implementation Process

1. **Current State Analysis**
   - Read existing documentation
   - Identify optimized and unoptimized items
   - Measure performance baseline

2. **Prioritize Optimizations**
   - Start with high-impact items
   - Consider balance with implementation cost

3. **Execute Optimizations**
   - Implement carefully, one at a time
   - Run tests after each optimization

4. **Measure Results**
   - Measure performance improvements
   - Check bundle size changes
   - Check memory usage changes

5. **Update Documentation**
   - Mark completed optimizations with ✅
   - Record implementation date and effect
   - Document next steps

---

## Documentation Format Example

```markdown
# Frontend Optimization Status

Last Updated: YYYY-MM-DD

## ✅ Optimized

### Bundle Size Optimization (2024-01-15)
- Enabled tree shaking
- Result: Bundle size 2.5MB → 1.8MB (28% reduction)

## ⏳ Unoptimized

### CSS Optimization
- Unused CSS removal needed
- Estimated effect: 15-20% file size reduction

## 📝 Notes
- Next: Start with image optimization
```

---

## Usage

When presenting this prompt to Claude, also provide the following information:

1. Target to optimize (Frontend/Backend/Other)
2. Project structure (file tree if needed)
3. Current performance issues (if any)
4. Priority optimization items (if any)

Claude will automatically:
- Check existence and create docs folder
- Read relevant optimization documentation
- Reference latest best practices
- Propose and implement optimizations
- Update documentation