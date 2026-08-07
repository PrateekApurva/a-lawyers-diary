import html
from datetime import date

import streamlit as st

import api_client as api

st.set_page_config(page_title="A Lawyer's Diary", page_icon="⚖️", layout="wide")


def init_state():
    defaults = {
        "token": None,
        "advocate_email": None,
        "view": "auth",
        "auth_mode": "login",
        "selected_case_id": None,
        "show_new_case_form": False,
        "dark_mode": False,
    }
    for key, value in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = value


def logout():
    st.session_state.token = None
    st.session_state.advocate_email = None
    st.session_state.view = "auth"
    st.session_state.selected_case_id = None


# ---------- Theme ----------
#
# Streamlit's own [theme] base=light config only sets the *default palette*
# — the frontend still auto-switches to dark when the OS is in dark mode,
# overriding it. To make "light by default, toggle for dark" actually hold
# regardless of the visitor's OS setting, both palettes are applied as CSS
# overrides ourselves; nothing is left to Streamlit's auto-detection.

_THEME_CSS = {
    "light": """
        --background-color: #FFFFFF;
        --secondary-background-color: #F0F2F6;
        --text-color: #31333F;
        --primary-color: #FF4B4B;
        --border-color: #D5D6D8;
        color-scheme: light;
    """,
    "dark": """
        --background-color: #0E1117;
        --secondary-background-color: #262730;
        --text-color: #FAFAFA;
        --primary-color: #FF4B4B;
        --border-color: #41444C;
        color-scheme: dark;
    """,
}


def apply_theme(mode: str):
    vars_css = _THEME_CSS[mode]
    st.markdown(
        f"""
        <style>
        :root, .stApp {{
            {vars_css}
        }}
        html, body,
        .stApp, [data-testid="stAppViewContainer"], [data-testid="stHeader"],
        [data-testid="stMain"], [data-testid="stBottomBlockContainer"], section.main {{
            background-color: var(--background-color) !important;
            color: var(--text-color) !important;
        }}
        [data-testid="stHeader"] {{ background-color: rgba(0,0,0,0) !important; }}
        [data-testid="stMarkdownContainer"], [data-testid="stWidgetLabel"],
        [data-testid="stCaptionContainer"] {{
            color: var(--text-color) !important;
        }}
        input, textarea, select,
        [data-baseweb="base-input"], [data-baseweb="input"], [data-baseweb="textarea"],
        [data-baseweb="select"] > div {{
            background-color: var(--secondary-background-color) !important;
            color: var(--text-color) !important;
            border-color: var(--border-color) !important;
        }}
        [data-testid="stBaseButton-secondary"], [data-testid="stBaseButton-secondaryFormSubmit"] {{
            background-color: var(--secondary-background-color) !important;
            color: var(--text-color) !important;
            border-color: var(--border-color) !important;
        }}
        [data-testid="stBaseButton-primary"] p, [data-testid="stBaseButton-primaryFormSubmit"] p {{
            color: #FFFFFF !important;
        }}
        [data-testid="stExpander"], [data-testid="stForm"] {{
            background-color: var(--secondary-background-color) !important;
            border-color: var(--border-color) !important;
        }}
        .ald-history-table th, .ald-history-table td {{
            text-align: left;
            padding: 8px 12px;
            border-bottom: 1px solid var(--border-color);
            color: var(--text-color);
        }}
        .ald-history-table th {{
            font-weight: 600;
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


def render_theme_toggle():
    _, toggle_col = st.columns([6, 1])
    with toggle_col:
        st.toggle("🌙 Dark", key="dark_mode")
    apply_theme("dark" if st.session_state.dark_mode else "light")


# ---------- Auth views ----------

def show_login():
    _, center, _ = st.columns([1, 1.2, 1])
    with center:
        st.title("⚖️ A Lawyer's Diary")
        st.subheader("Log in")
        with st.form("login_form"):
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Log in", type="primary")

        if submitted:
            try:
                token_data = api.login(email, password)
                st.session_state.token = token_data["access_token"]
                st.session_state.advocate_email = email
                st.session_state.view = "dashboard"
                st.rerun()
            except api.ApiError as e:
                st.error(str(e))

        st.caption("Don't have an account?")
        if st.button("Create one"):
            st.session_state.auth_mode = "signup"
            st.rerun()


def show_signup():
    _, center, _ = st.columns([1, 1.2, 1])
    with center:
        st.title("⚖️ A Lawyer's Diary")
        st.subheader("Create an account")
        with st.form("signup_form"):
            full_name = st.text_input("Full name")
            email = st.text_input("Email")
            password = st.text_input("Password", type="password")
            submitted = st.form_submit_button("Sign up", type="primary")

        if submitted:
            if not full_name or not email or not password:
                st.error("All fields are required.")
            else:
                try:
                    api.signup(full_name, email, password)
                    st.success("Account created. Please log in.")
                    st.session_state.auth_mode = "login"
                    st.rerun()
                except api.ApiError as e:
                    st.error(str(e))

        st.caption("Already have an account?")
        if st.button("Log in instead"):
            st.session_state.auth_mode = "login"
            st.rerun()


# ---------- Dashboard ----------

def show_new_case_form():
    with st.expander("➕ New case", expanded=True):
        with st.form("new_case_form", clear_on_submit=True):
            col1, col2 = st.columns(2)
            case_id = col1.text_input("Case ID / number")
            name = col2.text_input("Case name")

            col3, col4 = st.columns(2)
            court_name = col3.text_input("Court name")
            party_name = col4.text_input("Opposing / other party name")

            col5, col6, col7 = st.columns(3)
            position_stage = col5.text_input("Position / stage")
            filing_date = col6.date_input("Filing date", value=None)
            upcoming_date = col7.date_input("Next hearing date", value=None)

            col_submit, col_cancel = st.columns([1, 1])
            submitted = col_submit.form_submit_button("Create case", type="primary")
            cancelled = col_cancel.form_submit_button("Cancel")

        if cancelled:
            st.session_state.show_new_case_form = False
            st.rerun()

        if submitted:
            if not case_id or not name or not court_name or not party_name or not position_stage:
                st.error("Case ID, name, court, party, and position/stage are required.")
            else:
                try:
                    api.create_case(
                        {
                            "case_id": case_id,
                            "name": name,
                            "court_name": court_name,
                            "party_name": party_name,
                            "position_stage": position_stage,
                            "filing_date": filing_date.isoformat() if filing_date else None,
                            "upcoming_date": upcoming_date.isoformat() if upcoming_date else None,
                        }
                    )
                    st.session_state.show_new_case_form = False
                    st.success(f"Case '{name}' created.")
                    st.rerun()
                except api.ApiError as e:
                    st.error(str(e))


def show_dashboard():
    header_col, add_col, logout_col = st.columns([6, 1, 1])
    header_col.title("⚖️ My Cases")
    if add_col.button("➕ New", type="primary", use_container_width=True):
        st.session_state.show_new_case_form = not st.session_state.show_new_case_form
    if logout_col.button("Log out", use_container_width=True):
        logout()
        st.rerun()

    if st.session_state.show_new_case_form:
        show_new_case_form()

    try:
        cases = api.list_cases()
    except api.ApiError as e:
        st.error(str(e))
        return

    if not cases:
        st.info("No cases yet. Click **➕ New** to add your first case.")
        return

    st.divider()
    header = st.columns([1.2, 2.5, 1.5, 1.5, 1.5, 1, 0.8])
    for col, label in zip(
        header, ["Case ID", "Name", "Court", "Previous date", "Upcoming date", "Status", ""]
    ):
        col.markdown(f"**{label}**")

    for case in cases:
        hearing = case.get("current_hearing")
        row = st.columns([1.2, 2.5, 1.5, 1.5, 1.5, 1, 0.8])
        row[0].write(case["case_id"])
        row[1].write(case["name"])
        row[2].write(hearing["court_name"] if hearing else "—")
        row[3].write(hearing["previous_date"] if hearing and hearing["previous_date"] else "—")
        row[4].write(hearing["upcoming_date"] if hearing and hearing["upcoming_date"] else "—")
        row[5].write("🟢 Active" if case["status"] == "active" else "⚪ Closed")
        if row[6].button("Open", key=f"open_{case['id']}"):
            st.session_state.selected_case_id = case["id"]
            st.session_state.view = "case_detail"
            st.rerun()


# ---------- Case detail ----------

def show_case_detail():
    case_id = st.session_state.selected_case_id
    try:
        case = api.get_case(case_id)
    except api.ApiError as e:
        st.error(str(e))
        if st.button("← Back to dashboard"):
            st.session_state.view = "dashboard"
            st.rerun()
        return

    back_col, title_col = st.columns([1, 6])
    if back_col.button("← Back"):
        st.session_state.view = "dashboard"
        st.session_state.selected_case_id = None
        st.rerun()
    title_col.title(f"{case['name']}  ·  {case['case_id']}")

    status_badge = "🟢 Active" if case["status"] == "active" else "⚪ Closed"
    st.markdown(f"**Status:** {status_badge}")

    hearings = case["hearings"]
    current = next((h for h in hearings if h["is_current"]), None)

    if current and case["status"] == "active":
        st.subheader("Record hearing result")
        st.caption(
            f"Upcoming date on record: **{current['upcoming_date'] or '—'}**  ·  "
            f"Court: {current['court_name']}  ·  Stage: {current['position_stage']}"
        )
        with st.form("record_result_form"):
            result = st.text_area("Result / remarks", placeholder="What happened at this hearing?")
            end_matter = st.checkbox("This matter has concluded (no further hearing)")
            next_date = st.date_input(
                "Next hearing date", value=None, disabled=end_matter, key="next_date_input"
            )
            new_stage = st.text_input(
                "Updated position / stage (optional)", value=current["position_stage"]
            )
            submitted = st.form_submit_button("Save", type="primary")

        if submitted:
            if not result:
                st.error("Please enter a result / remark.")
            elif not end_matter and not next_date:
                st.error("Provide the next hearing date, or mark the matter as concluded.")
            else:
                try:
                    api.update_hearing(
                        case_id,
                        {
                            "result": result,
                            "position_stage": new_stage or None,
                            "next_date": next_date.isoformat() if (next_date and not end_matter) else None,
                            "end_matter": end_matter,
                        },
                    )
                    st.success("Hearing updated.")
                    st.rerun()
                except api.ApiError as e:
                    st.error(str(e))
    elif case["status"] == "closed":
        st.info("This matter has concluded. No further hearings are open.")

    st.divider()
    st.subheader("Hearing history")
    if not hearings:
        st.write("No hearings recorded yet.")
    else:
        columns = ["Status", "Filing date", "Court", "Party", "Stage", "Previous date", "Upcoming date", "Result"]
        header_html = "".join(f"<th>{c}</th>" for c in columns)
        body_rows = []
        for h in reversed(hearings):  # most recent first
            cells = [
                "🟢 Current" if h["is_current"] else "Closed",
                h["filing_date"] or "—",
                h["court_name"],
                h["party_name"],
                h["position_stage"],
                h["previous_date"] or "—",
                h["upcoming_date"] or "—",
                h["result"] or ("Pending" if h["is_current"] else "—"),
            ]
            cells_html = "".join(f"<td>{html.escape(str(c))}</td>" for c in cells)
            body_rows.append(f"<tr>{cells_html}</tr>")

        st.markdown(
            f"""
            <div style="overflow-x:auto;">
            <table class="ald-history-table" style="width:100%; border-collapse:collapse;">
                <thead><tr>{header_html}</tr></thead>
                <tbody>{''.join(body_rows)}</tbody>
            </table>
            </div>
            """,
            unsafe_allow_html=True,
        )

        can_rollback = case["status"] == "closed" or len(hearings) > 1
        if can_rollback:
            st.caption("Made a mistake on the most recent update?")
            if st.button("↩️ Undo last hearing update"):
                try:
                    api.rollback_hearing(case_id)
                    st.success("Last update undone.")
                    st.rerun()
                except api.ApiError as e:
                    st.error(str(e))

    st.divider()
    with st.expander("⚠️ Danger zone"):
        st.write(
            f"Deleting **{case['name']} ({case['case_id']})** permanently removes it "
            "and its entire hearing history. This cannot be undone."
        )
        confirm = st.checkbox("I understand, delete this case permanently", key="confirm_delete_case")
        if st.button("🗑️ Delete case", disabled=not confirm, type="primary"):
            try:
                api.delete_case(case_id)
                st.session_state.view = "dashboard"
                st.session_state.selected_case_id = None
                st.success("Case deleted.")
                st.rerun()
            except api.ApiError as e:
                st.error(str(e))


# ---------- Router ----------

def main():
    init_state()
    render_theme_toggle()

    if not st.session_state.token:
        if st.session_state.auth_mode == "signup":
            show_signup()
        else:
            show_login()
        return

    if st.session_state.view == "case_detail" and st.session_state.selected_case_id:
        show_case_detail()
    else:
        show_dashboard()


if __name__ == "__main__":
    main()
