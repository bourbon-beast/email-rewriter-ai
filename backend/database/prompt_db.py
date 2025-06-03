# File: backend/database/prompt_db.py
import sqlite3
import os

class PromptDatabase:
    def __init__(self, db_path="prompts.db"):
        self.db_path = db_path
        # Ensure the database directory exists, assuming db_path might contain directories
        db_dir = os.path.dirname(self.db_path)
        if db_dir and not os.path.exists(db_dir):
            os.makedirs(db_dir)

        # Initialize database if it doesn't exist
        # Connection will create the file if it doesn't exist,
        # but tables need to be explicitly created.
        if not os.path.exists(self.db_path) or os.path.getsize(self.db_path) == 0:
            self.init_database()
        else:
            # Check if tables exist, if not, initialize
            if not self._check_tables_exist():
                self.init_database()

    def _check_tables_exist(self):
        try:
            base_prompts_exists = self._execute_query("SELECT 1 FROM base_prompts LIMIT 1", fetchone=True)
            tones_exists = self._execute_query("SELECT 1 FROM tones LIMIT 1", fetchone=True)
            # prompt_history_exists = self._execute_query("SELECT 1 FROM prompt_history LIMIT 1", fetchone=True)
            # Not checking history table as it might be empty initially and that's fine.
            if base_prompts_exists and tones_exists:
                return True
        except sqlite3.OperationalError:
            # This typically means a table doesn't exist
            return False
        return False

    def _execute_query(self, query, params=(), fetchone=False, fetchall=False, commit=False):
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        try:
            cursor.execute(query, params)
            if commit:
                conn.commit()
            result = None
            if fetchone:
                result = cursor.fetchone()
            elif fetchall:
                result = cursor.fetchall()
        except sqlite3.Error as e:
            print(f"SQLite error: {e} for query: {query} with params: {params}")
            # Optionally re-raise or handle more gracefully
            raise
        finally:
            conn.close()
        return result

    def init_database(self):
        schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
        try:
            with open(schema_path, 'r') as f:
                schema_sql = f.read()

            conn = sqlite3.connect(self.db_path)
            cursor = conn.cursor()
            cursor.executescript(schema_sql) # Use executescript for multi-statement SQL
            conn.commit()
            conn.close()
            print(f"Database initialized and tables created from {schema_path}.")
            self._seed_initial_data()
        except FileNotFoundError:
            print(f"Error: schema.sql not found at {schema_path}. Make sure the file exists in the same directory as prompt_db.py.")
        except sqlite3.Error as e:
            print(f"An error occurred during database initialization: {e}")
        except Exception as e:
            print(f"A general error occurred during database initialization: {e}")

    def _seed_initial_data(self):
        print("Seeding initial data...")
        try:
            # Actual BRAND_TONE_GUIDANCE
            brand_tone_guidance_content = """You are an assistant writing on behalf of AcmeHR, an Australian HR and EOR platform.
Use clear, confident language, and follow Australian English spelling and conventions.
Avoid Americanisms like 'organize' or 'color' — prefer 'organise', 'colour', etc.
When referring to business terms, use Australian-appropriate language where applicable."""
            current_base = self.get_active_base_prompt()
            if not current_base:
                self.update_base_prompt(brand_tone_guidance_content, "Initial setup of brand tone guidance", is_initial_seed=True)
                print("Seeded initial base prompt.")
            else:
                print("Active base prompt already exists. Skipping seeding.")

            initial_tones = [
                ("professional", "Professional", "Maintain a formal, respectful, and objective tone. Avoid slang and overly casual language."),
                ("friendly", "Friendly", "Use a warm, approachable, and conversational tone. Feel free to use contractions and positive language."),
                ("concise", "Concise", "Be brief, to the point, and eliminate unnecessary words. Focus on clarity and efficiency."),
                ("action-oriented", "Action-Oriented", "Focus on encouraging the recipient to take a specific action. Use strong verbs and clear calls to action.")
            ]

            for keyword, label, instructions in initial_tones:
                if not self.get_tone_by_keyword(keyword):
                    self.create_tone(keyword, label, instructions, is_initial_seed=True)
                    print(f"Seeded tone: {keyword}")
                else:
                    print(f"Tone '{keyword}' already exists. Skipping seeding.")
            print("Initial data seeding process complete.")
        except Exception as e:
            print(f"Error during initial data seeding: {e}")

    def get_active_base_prompt(self):
        query = "SELECT content FROM base_prompts WHERE is_active = TRUE ORDER BY created_at DESC LIMIT 1"
        result = self._execute_query(query, fetchone=True)
        return result[0] if result else None

    def get_active_tones(self):
        query = "SELECT keyword, label, instructions FROM tones WHERE is_active = TRUE ORDER BY keyword"
        results = self._execute_query(query, fetchall=True)
        return [{"keyword": r[0], "label": r[1], "instructions": r[2]} for r in results] if results else []

    def get_tone_by_keyword(self, keyword):
        query = "SELECT keyword, label, instructions FROM tones WHERE keyword = ? AND is_active = TRUE"
        result = self._execute_query(query, (keyword,), fetchone=True)
        return {"keyword": result[0], "label": result[1], "instructions": result[2]} if result else None

    def update_base_prompt(self, content, reason, is_initial_seed=False):
        old_content = None
        if not is_initial_seed:
            old_content = self.get_active_base_prompt()
            # Fetch ID of current active prompt for logging, if it exists
            active_prompt_row = self._execute_query("SELECT id FROM base_prompts WHERE is_active = TRUE LIMIT 1", fetchone=True)
            # component_id_for_log = active_prompt_row[0] if active_prompt_row else None
            # This logic is tricky, as we are deactivating then inserting. Logging the new prompt's change.

        self._execute_query("UPDATE base_prompts SET is_active = FALSE WHERE is_active = TRUE", commit=True)
        query_insert = "INSERT INTO base_prompts (content, is_active) VALUES (?, TRUE)"
        self._execute_query(query_insert, (content,), commit=True)

        if not is_initial_seed:
            new_prompt_id_row = self._execute_query("SELECT id FROM base_prompts WHERE content = ? AND is_active = TRUE ORDER BY created_at DESC LIMIT 1", (content,), fetchone=True)
            if new_prompt_id_row:
                self._log_prompt_change('base', new_prompt_id_row[0], old_content, content, reason)
            else:
                # Fallback if somehow ID isn't fetched (should not happen with this logic)
                self._log_prompt_change('base', -1, old_content, content, reason) # -1 indicates an issue with ID retrieval

    def update_tone_instructions(self, keyword, instructions, reason):
        current_tone = self.get_tone_by_keyword(keyword)
        if not current_tone:
            print(f"Tone with keyword '{keyword}' not found. Cannot update.")
            return

        old_instructions = current_tone['instructions']
        tone_id_row = self._execute_query("SELECT id FROM tones WHERE keyword = ?", (keyword,), fetchone=True)
        if not tone_id_row:
            print(f"Could not find ID for tone '{keyword}'.") # Should not happen if current_tone was found
            return
        tone_id = tone_id_row[0]

        query_update = "UPDATE tones SET instructions = ?, updated_at = CURRENT_TIMESTAMP WHERE keyword = ?"
        self._execute_query(query_update, (instructions, keyword), commit=True)
        self._log_prompt_change('tone', tone_id, old_instructions, instructions, reason)

    def create_tone(self, keyword, label, instructions, is_initial_seed=False):
        try:
            query = "INSERT INTO tones (keyword, label, instructions, is_active) VALUES (?, ?, ?, TRUE)"
            self._execute_query(query, (keyword, label, instructions), commit=True)
            if not is_initial_seed:
                new_tone_id_row = self._execute_query("SELECT id FROM tones WHERE keyword = ?", (keyword,), fetchone=True)
                if new_tone_id_row:
                    self._log_prompt_change('tone', new_tone_id_row[0], None, instructions, f"Created new tone: {label}")
        except sqlite3.IntegrityError:
            print(f"Error: Tone with keyword '{keyword}' already exists.")
            raise

    def build_final_prompt(self, tone_keyword, email_content):
        base_prompt_content = self.get_active_base_prompt()
        if not base_prompt_content:
            base_prompt_content = "Please rewrite the following email to enhance its clarity and impact:"

        tone_details = self.get_tone_by_keyword(tone_keyword)
        tone_instructions = ""
        if tone_details and tone_details['instructions']:
            tone_instructions = f"\n\nTone Guidance ({tone_details.get('label', tone_keyword)}):\n{tone_details['instructions']}"

        final_prompt = f"{base_prompt_content}{tone_instructions}\n\nEmail to rewrite:\n---\n{email_content}\n---"
        return final_prompt

    def _log_prompt_change(self, component_type, component_id, old_content, new_content, reason):
        query = """
            INSERT INTO prompt_history (component_type, component_id, old_content, new_content, change_reason)
            VALUES (?, ?, ?, ?, ?)
        """
        self._execute_query(query, (component_type, component_id, old_content, new_content, reason), commit=True)

    def get_prompt_history(self, limit=50):
        # Query modified to correctly fetch component name (label for tone, content snippet for base)
        query = """
            SELECT
                ph.id,
                ph.component_type,
                ph.component_id,
                CASE ph.component_type
                    WHEN 'base' THEN SUBSTR(bp.content, 1, 50) || CASE WHEN LENGTH(bp.content) > 50 THEN '...' ELSE '' END
                    WHEN 'tone' THEN t.label
                    ELSE 'N/A'
                END AS component_name,
                ph.old_content,
                ph.new_content,
                ph.change_reason,
                ph.created_at
            FROM prompt_history ph
            LEFT JOIN base_prompts bp ON ph.component_type = 'base' AND bp.id = ph.component_id
            LEFT JOIN tones t ON ph.component_type = 'tone' AND t.id = ph.component_id
            ORDER BY ph.created_at DESC
            LIMIT ?
        """
        return self._execute_query(query, (limit,), fetchall=True)

if __name__ == '__main__':
    # --- Test Setup ---
    test_db_path = "test_prompts.db"
    if os.path.exists(test_db_path):
        os.remove(test_db_path)
        print(f"Removed old '{test_db_path}'.")

    # Create an instance of PromptDatabase for testing
    # The __init__ method will call init_database, which calls _seed_initial_data
    db = PromptDatabase(db_path=test_db_path)
    print(f"--- Test Database '{test_db_path}' Initialized ---")

    # --- Test Basic Operations ---
    print("\n--- Testing get_active_base_prompt ---")
    active_base = db.get_active_base_prompt()
    print(f"Active Base Prompt: {active_base}")
    assert active_base is not None, "Initial base prompt should be seeded."

    print("\n--- Testing get_active_tones ---")
    active_tones = db.get_active_tones()
    print(f"Active Tones: {active_tones}")
    assert len(active_tones) == 4, "Should be 4 initial tones seeded and active."

    print("\n--- Testing get_tone_by_keyword ('friendly') ---")
    friendly_tone = db.get_tone_by_keyword("friendly")
    print(f"Friendly Tone: {friendly_tone}")
    assert friendly_tone is not None and friendly_tone['keyword'] == "friendly", "Friendly tone not found."

    # --- Test Updates and History Logging ---
    print("\n--- Testing update_base_prompt ---")
    new_base_content = "This is the new and improved base prompt content for all interactions."
    reason_base_update = "Annual review of base prompt effectiveness."
    db.update_base_prompt(new_base_content, reason_base_update)
    updated_base = db.get_active_base_prompt()
    print(f"Updated Base Prompt: {updated_base}")
    assert updated_base == new_base_content, "Base prompt content did not update."

    print("\n--- Testing update_tone_instructions ('professional') ---")
    new_prof_instructions = "Updated professional instructions: Maintain utmost decorum and use sophisticated language."
    reason_prof_update = "Refinement based on user feedback."
    db.update_tone_instructions("professional", new_prof_instructions, reason_prof_update)
    updated_prof_tone = db.get_tone_by_keyword("professional")
    print(f"Updated Professional Tone Instructions: {updated_prof_tone['instructions']}")
    assert updated_prof_tone['instructions'] == new_prof_instructions, "Professional tone instructions did not update."

    # --- Test Creation and Integrity Error ---
    print("\n--- Testing create_tone ('innovative') ---")
    new_tone_keyword = "innovative"
    new_tone_label = "Innovative"
    new_tone_instructions = "Encourage forward-thinking ideas and novel solutions."
    db.create_tone(new_tone_keyword, new_tone_label, new_tone_instructions)
    innovative_tone = db.get_tone_by_keyword(new_tone_keyword)
    print(f"Created Innovative Tone: {innovative_tone}")
    assert innovative_tone is not None and innovative_tone['label'] == new_tone_label, "Innovative tone not created."
    active_tones_after_create = db.get_active_tones()
    assert len(active_tones_after_create) == 5, "Total active tones should be 5 after creation."

    print("\n--- Testing create_tone (duplicate 'innovative') ---")
    try:
        db.create_tone(new_tone_keyword, "Innovative Duplicate", "This should not be added.")
    except sqlite3.IntegrityError as e:
        print(f"Caught expected IntegrityError: {e}")
    except Exception as e:
        print(f"Caught unexpected error: {e}")
        assert False, "Expected IntegrityError but got something else."

    # --- Test build_final_prompt ---
    print("\n--- Testing build_final_prompt ('friendly') ---")
    email_body = "I hope this email finds you well. I wanted to ask about the project status."
    final_prompt_friendly = db.build_final_prompt("friendly", email_body)
    print(f"Final Prompt (Friendly):\n{final_prompt_friendly}")
    assert "Tone Guidance (Friendly)" in final_prompt_friendly, "Friendly tone guidance missing."
    assert new_base_content in final_prompt_friendly, "Base prompt content missing in final prompt."
    assert email_body in final_prompt_friendly, "Email body missing in final prompt."

    print("\n--- Testing build_final_prompt (non-existent tone 'experimental') ---")
    final_prompt_experimental = db.build_final_prompt("experimental", email_body)
    print(f"Final Prompt (Experimental - non-existent tone):\n{final_prompt_experimental}")
    assert "Tone Guidance" not in final_prompt_experimental, "Tone guidance should not appear for non-existent tone."
    assert new_base_content in final_prompt_experimental, "Base prompt content missing in final prompt for non-existent tone."

    # --- Test Prompt History ---
    print("\n--- Testing get_prompt_history ---")
    history = db.get_prompt_history(limit=10)
    print(f"Prompt History (last 10 entries):")
    for entry in history:
        print(entry)
    # Expected: 1 initial base, 4 initial tones (if not is_initial_seed), 1 base update, 1 tone update, 1 tone create
    # With is_initial_seed=True for seeding, we expect: 1 base update, 1 tone update, 1 tone create = 3 entries
    # The initial seed for base prompt also logs one entry if no base prompt exists initially.
    # So, 1 (initial base) + 1 (base update) + 1 (tone update) + 1 (tone create) = 4 expected entries.
    assert len(history) >= 3, f"Expected at least 3 history entries, got {len(history)}."

    print("\n--- Testing init_database on existing DB (should skip seeding) ---")
    # Re-initialize on the same DB path.
    # The _check_tables_exist should prevent re-running schema and _seed_initial_data
    # if tables already have content (or rather, if they exist and seeding logic checks for content).
    db_existing = PromptDatabase(db_path=test_db_path) # This will trigger init if tables are not found, or if db file is empty
    # The seeding logic itself checks if data exists, so it should print "already exists" messages.
    print("Finished re-initializing. Check logs above for 'already exists' messages for tones/base prompt.")

    print("\n--- All Tests Passed (if assertions didn't fail) ---")
