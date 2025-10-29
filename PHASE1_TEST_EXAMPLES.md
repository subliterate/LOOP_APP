# Phase 1 Testing: Enhanced Research Depth & Academic Level

This document provides test examples for the Phase 1 implementation of research depth enhancement.

## Test Environment Setup

```bash
# Build the CLI
npm run build:cli

# Start the backend server (in another terminal)
npm run server
```

## Test Cases

### Test 1: Basic Casual Depth (500-1000 words, HS level)

**Command:**
```bash
node cli-dist/cli.js "machine learning" --depth casual --academic-level ba
```

**Expected Result:**
- Output: 500-1000 words
- Reading level: Accessible, general audience
- Structure: Overview of key aspects
- No complex jargon without explanation

---

### Test 2: Professional Depth (1500-2000 words, Professional level)

**Command:**
```bash
node cli-dist/cli.js "quantum computing" --depth professional --academic-level ba
```

**Expected Result:**
- Output: 1500-2000 words
- Reading level: Professional, informative
- Structure: Context, practices, implications, use cases
- Actionable insights for professionals

---

### Test 3: Scholarly Depth (3000-4000 words, Bachelor's level)

**Command:**
```bash
node cli-dist/cli.js "artificial intelligence ethics" --depth scholarly --academic-level ba
```

**Expected Result:**
- Output: 3000-4000 words
- Reading level: Upper-level undergraduate/early graduate
- Structure: Introduction with thesis, historical context, theoretical frameworks, multiple perspectives, empirical evidence, critical analysis, future directions, conclusion
- Multiple viewpoints and scholarly debate

---

### Test 4: Expert Depth (5000-6000 words, PhD level)

**Command:**
```bash
node cli-dist/cli.js "neural network optimization techniques" --depth expert --academic-level phd
```

**Expected Result:**
- Output: 5000-6000 words
- Reading level: Doctoral/expert level
- Structure: Formal introduction, literature review, theoretical positioning, critical examination of competing frameworks, empirical analysis, methodological critique, emerging research, original insights, research gaps
- Cutting-edge analysis and research frontiers

---

### Test 5: Academic Level Variations (All at Scholarly Depth)

**Bachelor's Level:**
```bash
node cli-dist/cli.js "climate change" --depth scholarly --academic-level ba
```

**Master's Level:**
```bash
node cli-dist/cli.js "climate change" --depth scholarly --academic-level ma
```

**PhD Level:**
```bash
node cli-dist/cli.js "climate change" --depth scholarly --academic-level phd
```

**Expected Differences:**
- **BA**: Sophisticated but accessible vocabulary, complex ideas explained clearly
- **MA**: Advanced disciplinary terminology, complex argumentation with nuance
- **PhD**: Specialized technical terminology, highly sophisticated analysis

---

### Test 6: Environment Variable Configuration

**Set defaults via environment:**
```bash
RESEARCH_DEPTH=expert RESEARCH_ACADEMIC_LEVEL=phd node cli-dist/cli.js "quantum mechanics"
```

**Override with CLI options:**
```bash
RESEARCH_DEPTH=casual node cli-dist/cli.js "quantum mechanics" --depth scholarly
```

---

### Test 7: Multi-Loop Research with Enhanced Depth

**Command:**
```bash
node cli-dist/cli.js "renewable energy" --loops 3 --depth scholarly --academic-level ba
```

**Expected Result:**
- Loop 1: Research "renewable energy" (3000-4000 words, scholarly, BA level)
- Auto-generates next inquiry based on first research
- Loop 2: Research suggested topic with same configuration
- Loop 3: Research third suggested topic

---

### Test 8: Debug Mode Configuration

**Command:**
```bash
LOG_LEVEL=DEBUG node cli-dist/cli.js "biotechnology" --depth professional --academic-level ma
```

**Expected Output:**
```
[DEBUG] Configuration: {
  apiBaseUrl: 'localhost:4000',
  loopCount: 1,
  depth: 'professional',
  academicLevel: 'ma',
  logLevel: 'DEBUG',
  logFormat: 'text'
}
```

---

### Test 9: API Server with Different Depths

**Command (Terminal 1 - Server):**
```bash
npm run server
```

**Command (Terminal 2 - Direct API Test):**
```bash
curl -X POST http://localhost:4000/api/research \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "blockchain technology",
    "depth": "scholarly",
    "academicLevel": "ba",
    "includePerspectives": true,
    "includeCaseStudies": true,
    "includeMethodology": false
  }'
```

---

## Quality Verification Checklist

For each test case, verify:

- [ ] Word count is within expected range (use `wc -w`)
- [ ] Content is structured according to the depth specification
- [ ] Language level matches academic level requirement
- [ ] Thesis-driven argument present (for professional+ depths)
- [ ] Multiple perspectives included (for scholarly+ depths)
- [ ] Evidence and examples provided (for professional+ depths)
- [ ] Proper section breaks and formatting
- [ ] No markdown formatting or asterisks
- [ ] Sources are present and valid

---

## Sample Topics by Domain

### Technology & AI
- Machine learning applications
- Artificial intelligence ethics
- Quantum computing trends
- Blockchain technology
- Cybersecurity threats

### Science & Environment
- Climate change solutions
- Renewable energy
- Biotechnology advances
- Nanotechnology
- Space exploration

### Social Sciences
- Economic inequality
- Social media impact
- Education transformation
- Public health policy
- Urban development

### Business & Economics
- Remote work trends
- E-commerce evolution
- Cryptocurrency markets
- Startup ecosystems
- Supply chain resilience

---

## Output Comparison Examples

### Same Topic, Different Depths

**Topic:** "Artificial Intelligence"

**Casual (500-1000 words):**
```
AI Overview
- What AI is and basic examples
- Current applications (ChatGPT, recommendations)
- Key technologies (machine learning, neural networks)
- Current status and availability
```

**Professional (1500-2000 words):**
```
- Definition and key concepts
- Practical implementations across industries
- Business implications and ROI
- Case studies from real deployments
- Career opportunities in AI
- Implementation considerations
```

**Scholarly (3000-4000 words):**
```
- Historical context and evolution of AI
- Theoretical frameworks (symbolic vs. neural)
- Multiple perspectives (optimists vs. skeptics)
- Empirical research findings
- Ethical considerations and debates
- Future research directions
```

**Expert (5000-6000 words):**
```
- Formal introduction with positioning
- Literature review of key research
- Competing theoretical frameworks (comparison)
- Empirical analysis of state-of-the-art methods
- Methodological critique of current approaches
- Emerging research frontiers
- Original insights on limitations
- Research gaps and future implications
```

---

## Performance Metrics

### Expected API Response Times
- Casual depth: 15-20 seconds
- Professional depth: 20-30 seconds
- Scholarly depth: 25-35 seconds
- Expert depth: 35-45 seconds

(Times vary based on Gemini API availability and network conditions)

### Expected Token Usage
- Casual: ~250-400 tokens
- Professional: ~400-600 tokens
- Scholarly: ~600-1000 tokens
- Expert: ~1000-1500 tokens

---

## Known Limitations

### Phase 1 Limitations
1. No fact-checking or source verification
2. Hallucinations possible at longer outputs
3. Token costs increase significantly with depth
4. API rate limits may affect multi-loop runs
5. No caching of results

### Future Improvements (Phase 2+)
- Add fact-checking layer
- Implement result caching
- Add request deduplication
- Support for custom depth levels
- Export to various formats (PDF, HTML, etc.)

---

## Troubleshooting

### Issue: Empty response from Gemini
**Solution:** Check API key, verify network connectivity, try with shorter prompt

### Issue: Timeout on longer depths
**Solution:** May be normal for expert depth; allow 45+ seconds

### Issue: Inconsistent word counts
**Solution:** Gemini varies slightly; aim for within ±10% of target

### Issue: Server not responding
**Solution:** Ensure server is running with `npm run server`

---

## Success Criteria for Phase 1

✅ All depth levels produce appropriate output
✅ Academic levels produce readable content at appropriate level
✅ Word counts are within target ranges
✅ Multiple perspectives included for scholarly+ depths
✅ CLI options work correctly
✅ Environment variables can set defaults
✅ Multi-loop research works with new configuration
✅ Help text documents all options

---

**Last Updated:** October 29, 2025
**Phase:** Phase 1 Implementation Testing
