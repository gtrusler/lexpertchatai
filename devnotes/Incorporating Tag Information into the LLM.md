# Incorporating Tag Information into the LLM

To ensure the LLM leverages tags effectively, we need to integrate tag context into the Retrieval-Augmented Generation (RAG) pipeline. This involves embedding tag definitions and usage instructions into the LLM’s prompts and retrieval process, so it knows how to apply each tag to documents and tailor responses. Here’s how we’ll do it:

#### Approach

1. **Tag Metadata in Supabase**:
   
   - Store tag definitions and LLM instructions in the `tags` table, adding a `llm_context` field to guide the LLM’s behavior.
   - This ensures the LLM has explicit instructions for each tag, improving consistency and accuracy (95% target).

2. **RAG Pipeline Integration**:
   
   - Filter documents in Supabase VectorDB by tags during retrieval, using the tag’s category and context.
   - Include tag metadata in the LLM prompt to shape the response (e.g., formal tone for `[pleading]`, factual tone for `[affidavit]`).

3. **Prompt Engineering**:
   
   - Prepend tag-specific instructions to the user’s query, ensuring the LLM interprets tags correctly.
   - Use prompt coaching to guide Cristi in applying tags, reinforcing their intended use.

#### Updated Tag List with LLM Context

We’ll refine the tag list based on your brain dump with Cristi, incorporating the new tags (`[hearing_transcript]`, `[deposition_transcript]`, `[supporting_case]`) and adding `llm_context` for LLM application. We’ll prioritize family law, with trademarks as secondary.

| **Tag**                     | **Category**                 | **Definition**                                                                       | **Context for LLM Use**                                                                                                      | **LLM Context (Instructions)**                                                                                                           | **Example Use by Cristi**                                      |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **[pleading]**              | Family Law                   | A formal document filed with the court (e.g., petition, motion, response, order).    | Retrieve or draft court filings; prioritize legal arguments, citations (e.g., Texas Family Code), and formal structure.      | “Interpret as a court filing; use formal language, include legal citations (e.g., Texas Family Code), and maintain a structured format.” | “Draft a custody motion using [pleading] for Rachel Weyl.”     |
| **[brief]**                 | Family Law                   | A legal argument document summarizing a case or issue for the court.                 | Generate or analyze summaries, legal arguments, or case law references; focus on persuasive tone and concise reasoning.      | “Interpret as a legal argument summary; use persuasive tone, keep concise, and reference relevant case law.”                             | “Summarize the [brief] for the Weyl case.”                     |
| **[affidavit]**             | Family Law                   | A sworn statement of facts, often supporting a motion, petition, or order.           | Extract factual claims, support motions/petitions, or draft affidavits; emphasize factual accuracy and notarization details. | “Interpret as a sworn statement; focus on factual accuracy, include notarization details, and support legal arguments.”                  | “Use [affidavit] to support the custody motion.”               |
| **[temporary_order]**       | Family Law                   | A court order setting temporary terms (e.g., custody, support) until a final ruling. | Draft or analyze temporary arrangements; focus on interim legal requirements, timelines, and stability arguments.            | “Interpret as an interim court order; focus on temporary terms, timelines, and stability arguments, citing relevant law.”                | “Draft a [temporary_order] for Weyl custody.”                  |
| **[hearing_transcript]**    | Family Law                   | A verbatim record of court proceedings from a hearing.                               | Retrieve or analyze spoken testimony, rulings, or arguments from hearings; focus on real-time context and oral evidence.     | “Interpret as a hearing record; focus on oral testimony, rulings, and real-time context, avoiding legal drafting.”                       | “Summarize the [hearing_transcript] from Weyl’s last hearing.” |
| **[deposition_transcript]** | Family Law                   | A sworn out-of-court testimony recorded during discovery.                            | Retrieve or analyze witness statements, cross-examinations, or factual evidence; focus on pre-trial context.                 | “Interpret as a deposition record; focus on witness statements, cross-examinations, and pre-trial evidence, avoiding formal drafting.”   | “Use [deposition_transcript] to challenge Jane Doe’s claim.”   |
| **[supporting_case]**       | Family Law                   | A legal precedent or case law document relevant to the current case.                 | Retrieve or cite case law to support arguments; prioritize judicial opinions, precedents, and legal reasoning.               | “Interpret as a legal precedent; prioritize judicial opinions and precedents, use for legal reasoning and citation support.”             | “Cite a [supporting_case] for custody stability in Weyl.”      |
| **[example]**               | Both (Family Law, Trademark) | A sample document not specific to the case, used as a formatting reference.          | Use as a formatting guide or template; avoid citing directly in responses—treat as a stylistic model.                        | “Interpret as a formatting template; use for structure only, avoid factual or legal citations.”                                          | “Format a motion like this [example].”                         |
| **[office_action]**         | Trademark                    | A USPTO document rejecting or objecting to a trademark application.                  | Draft responses to USPTO, cite TMEP, and address examiner issues; focus on trademark law and likelihood of confusion.        | “Interpret as a USPTO objection; focus on trademark law, cite TMEP, and address examiner issues with likelihood of confusion analysis.”  | “Draft a response to [office_action] for Beyond Health MD.”    |

---

### How Tags Will Be Incorporated into the LLM

#### Implementation Details

- **Supabase Storage**:
  - Update the `tags` table to include the `llm_context` field:
    - Schema: `id`, `name`, `description`, `category`, `llm_context`.
    - Example Data:
      
      ```sql
      INSERT INTO tags (name, description, category, llm_context) VALUES
      ('pleading', 'A formal document filed with the court...', 'family_law', 'Interpret as a court filing; use formal language, include legal citations (e.g., Texas Family Code), and maintain a structured format.'),
      ('brief', 'A legal argument document summarizing a case...', 'family_law', 'Interpret as a legal argument summary; use persuasive tone, keep concise, and reference relevant case law.'),
      ('affidavit', 'A sworn statement of facts...', 'family_law', 'Interpret as a sworn statement; focus on factual accuracy, include notarization details, and support legal arguments.'),
      ('temporary_order', 'A court order setting temporary terms...', 'family_law', 'Interpret as an interim court order; focus on temporary terms, timelines, and stability arguments, citing relevant law.'),
      ('hearing_transcript', 'A verbatim record of court proceedings...', 'family_law', 'Interpret as a hearing record; focus on oral testimony, rulings, and real-time context, avoiding legal drafting.'),
      ('deposition_transcript', 'A sworn out-of-court testimony...', 'family_law', 'Interpret as a deposition record; focus on witness statements, cross-examinations, and pre-trial evidence, avoiding formal drafting.'),
      ('supporting_case', 'A legal precedent or case law document...', 'family_law', 'Interpret as a legal precedent; prioritize judicial opinions and precedents, use for legal reasoning and citation support.'),
      ('example', 'A sample document not specific to the case...', 'both', 'Interpret as a formatting template; use for structure only, avoid factual or legal citations.'),
      ('office_action', 'A USPTO document rejecting a trademark application...', 'trademark', 'Interpret as a USPTO objection; focus on trademark law, cite TMEP, and address examiner issues with likelihood of confusion analysis.');
      ```
- **RAG Pipeline Integration**:
  - Modify the FastAPI `/api/rag` endpoint to include tag metadata in the retrieval query:
    - Example: For “Draft a custody motion using [pleading]”, filter Supabase VectorDB for documents tagged `[pleading]`, then pass the `llm_context` (“Interpret as a court filing…”) to the LLM prompt.
    - Use LangChain or LlamaIndex to combine tag-filtered documents with the user query.
- **Prompt Engineering**:
  - Prepend the `llm_context` to the LLM prompt dynamically:
    - Example Prompt: “Interpret as a court filing; use formal language, include legal citations (e.g., Texas Family Code), and maintain a structured format. User query: Draft a custody motion using [pleading] for Rachel Weyl in Travis County.”
  - Ensure the LLM weights tag-filtered documents higher in its response generation.
- **Wizard and Auto-Tagging**:
  - Keep the “Tag Files” step with a dropdown filtered by case type (e.g., `GET /tags?category=family_law`), using keyword-based auto-tagging with confirmation if <90% confidence.
  - Prompt coaching suggests tags with their intended use (e.g., “Try ‘Use [pleading] for court filings’” in a blue #0078D4 tooltip).

#### Performance and Scalability

- Ensure tag metadata retrieval and prompt prepending add <100ms to the RAG pipeline, keeping total response time under 5s.
- Test with 100+ tags and 50+ users to confirm Supabase/Redis and LLM integration scale without lag.

---

### Next Steps to Focus on Tagging and LLM Integration

Let’s refine this discrete task with clear steps to incorporate tag information into the LLM, ensuring progress by March 11, 2025:

1. **Update Tags with LLM Context in Supabase**:
   
   - **Timeline**: 1 day (March 7, 2025)
   - **Tasks**:
     - Modify the `tags` table to include the `llm_context` field.
     - Populate with the updated tag list and instructions (e.g., SQL inserts as shown).
   - **Validation**: Verify tag metadata loads correctly via `GET /tags` in <1s.

2. **Integrate Tag Context into RAG Pipeline**:
   
   - **Timeline**: 1 day (March 8, 2025)
   - **Tasks**:
     - Update the FastAPI `/api/rag` endpoint to filter documents by tags and include `llm_context` in the prompt.
     - Test with LangChain or LlamaIndex to ensure tag-filtered retrieval works.
   - **Validation**: Test with “Draft a motion using [pleading]”, ensuring <3s retrieval and correct document filtering.

3. **Configure LLM Prompt Engineering**:
   
   - **Timeline**: 1 day (March 9, 2025)
   - **Tasks**:
     - Prepend `llm_context` to LLM prompts (e.g., OpenAI GPT-4o or Anthropic Claude 3.5 Sonnet).
     - Update prompt coaching to reflect tag usage (e.g., “Try ‘Use [affidavit] for factual support’”).
   - **Validation**: Test with Cristi’s prompt (e.g., “Use [affidavit] to support custody motion”), ensuring a 3-5s response with correct tone and citations.

4. **Test and Validate with Cristi**:
   
   - **Timeline**: 1 day (March 10, 2025)
   - **Tasks**:
     - Run unit tests (Jest) on tag filtering, prompt prepending, and LLM responses.
     - Conduct integration tests with Cristi’s cases (e.g., Weyl family law), targeting 3-5s, 95% accuracy.
     - Discuss with Cristi to validate tag application (e.g., “Does [hearing_transcript] make sense here?”), refining `llm_context` if needed.
   - **Validation**: Confirm performance (<5s), accuracy (95%), and usability (90% satisfaction).

5. **Document and Prepare for Next Steps**:
   
   - **Timeline**: 1 day (March 11, 2025)
   - **Tasks**:
     - Update README.md with tag definitions, LLM usage, and implementation details.
     - Prepare to expand to wizard refinement or dashboard enhancements post-tagging.
   - **Validation**: Ensure documentation is clear for future reference.

---

### My Take (Honest Feedback)

Incorporating tag information into the LLM with `llm_context` is the trick to making Lexpert work for Cristi—it ensures the AI applies tags correctly, boosting accuracy and usability. Your brain dump with Cristi’s input strengthens the family law focus, and the approach keeps it lightweight for the MVP. A few critiques:

- **Performance Risk**: Ensure tag metadata and prompt prepending stay under 100ms—test with 100+ tags to confirm <5s responses.
- **Cristi’s Usability**: Run the tag application by her—watch for confusion (e.g., unclear `[deposition_transcript]` usage). Adjust `llm_context` or add tooltips if needed.
- **Scalability**: Verify Supabase/Redis handle 100+ tags—load test early to avoid bottlenecks.

This plan nails the tagging and LLM integration by March 11, 2025, a discrete win to build momentum. Want to mock a prompt with `llm_context`, tweak a tag’s instructions, or adjust the timeline? I’m here to help stay focused!
