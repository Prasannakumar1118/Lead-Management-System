from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_complete_e2e_workflow(client: TestClient):
    """End-to-End Workflow Verification covering all 12 specified steps:

    1. Register a new user.
    2. Log in.
    3. Access the protected dashboard.
    4. Create a lead.
    5. Search for the lead.
    6. Filter by status and date.
    7. Edit the lead.
    8. Verify that dashboard metrics update.
    9. View lead details.
    10. Delete the lead after confirmation.
    11. Log out and verify protected resources cannot be accessed without authentication.
    12. Verify that one user cannot access another user's leads.
    """
    # ---------------------------------------------------------
    # 1. Register a new user
    # ---------------------------------------------------------
    user_email = f"e2e_user_{datetime.now(UTC).timestamp()}@swandigital.com"
    password = "SecurePassword2026!"
    reg_payload = {
        "email": user_email,
        "full_name": "E2E Test User",
        "password": password,
        "role": "USER",
    }
    reg_resp = client.post("/api/v1/auth/register", json=reg_payload)
    assert reg_resp.status_code == 201, f"Registration failed: {reg_resp.text}"
    reg_data = reg_resp.json()
    assert "access_token" in reg_data
    assert reg_data["user"]["email"] == user_email
    assert "password_hash" not in reg_data["user"]

    # ---------------------------------------------------------
    # 2. Log in
    # ---------------------------------------------------------
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": user_email, "password": password},
    )
    assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
    login_data = login_resp.json()
    token = login_data["access_token"]
    auth_headers = {"Authorization": f"Bearer {token}"}

    # ---------------------------------------------------------
    # 3. Access the protected dashboard
    # ---------------------------------------------------------
    stats_resp = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert stats_resp.status_code == 200, f"Dashboard stats failed: {stats_resp.text}"
    initial_stats = stats_resp.json()
    assert "total_leads" in initial_stats
    assert "conversion_rate" in initial_stats
    initial_total = initial_stats["total_leads"]

    charts_resp = client.get("/api/v1/dashboard/charts", headers=auth_headers)
    assert charts_resp.status_code == 200, f"Dashboard charts failed: {charts_resp.text}"
    charts_data = charts_resp.json()
    assert "distribution" in charts_data
    assert "trend" in charts_data

    followups_resp = client.get("/api/v1/dashboard/follow-ups", headers=auth_headers)
    assert followups_resp.status_code == 200, f"Follow-ups failed: {followups_resp.text}"
    followups_data = followups_resp.json()
    assert "upcoming" in followups_data
    assert "overdue" in followups_data

    # ---------------------------------------------------------
    # 4. Create a lead
    # ---------------------------------------------------------
    lead_name = f"Apex Logistics {datetime.now(UTC).timestamp()}"
    follow_up = (datetime.now(UTC) + timedelta(days=3)).isoformat()
    lead_payload = {
        "name": lead_name,
        "email": "contact@apexlogistics.com",
        "phone_number": "+1-555-492-1029",
        "company": "Apex Logistics Ltd",
        "service_interested": "Full-Stack Web Platform",
        "source": "LinkedIn",
        "status": "New",
        "follow_up_date": follow_up,
        "notes": "Met at TechExpo 2026. Needs Q3 MVP rollout.",
    }
    create_resp = client.post("/api/v1/leads", json=lead_payload, headers=auth_headers)
    assert create_resp.status_code == 201, f"Lead creation failed: {create_resp.text}"
    created_lead = create_resp.json()
    lead_id = created_lead["id"]
    assert created_lead["name"] == lead_name
    assert created_lead["status"] == "New"
    assert created_lead["source"] == "LinkedIn"

    # ---------------------------------------------------------
    # 5. Search for the lead
    # ---------------------------------------------------------
    search_resp = client.get(
        f"/api/v1/leads?search={lead_name}",
        headers=auth_headers,
    )
    assert search_resp.status_code == 200, f"Search failed: {search_resp.text}"
    search_items = search_resp.json()["items"]
    assert len(search_items) >= 1
    assert any(lead["id"] == lead_id for lead in search_items)

    # ---------------------------------------------------------
    # 6. Filter by status and date
    # ---------------------------------------------------------
    today_start = (datetime.now(UTC) - timedelta(days=1)).strftime("%Y-%m-%dT%H:%M:%SZ")
    future_date = (datetime.now(UTC) + timedelta(days=7)).strftime("%Y-%m-%dT%H:%M:%SZ")
    filter_resp = client.get(
        f"/api/v1/leads?status=New&created_after={today_start}&follow_up_before={future_date}",
        headers=auth_headers,
    )
    assert filter_resp.status_code == 200, f"Filter failed: {filter_resp.text}"
    filtered_items = filter_resp.json()["items"]
    assert any(lead["id"] == lead_id for lead in filtered_items)
    for item in filtered_items:
        assert item["status"] == "New"

    # ---------------------------------------------------------
    # 7. Edit the lead (Pipeline transition to Converted)
    # ---------------------------------------------------------
    patch_payload = {
        "status": "Converted",
        "notes": "Deal closed! Client signed annual contract.",
    }
    patch_resp = client.patch(
        f"/api/v1/leads/{lead_id}",
        json=patch_payload,
        headers=auth_headers,
    )
    assert patch_resp.status_code == 200, f"Update lead failed: {patch_resp.text}"
    updated_lead = patch_resp.json()
    assert updated_lead["status"] == "Converted"
    assert "annual contract" in updated_lead["notes"]

    # ---------------------------------------------------------
    # 8. Verify that dashboard metrics update
    # ---------------------------------------------------------
    new_stats_resp = client.get("/api/v1/dashboard/stats", headers=auth_headers)
    assert new_stats_resp.status_code == 200
    new_stats = new_stats_resp.json()
    assert new_stats["total_leads"] == initial_total + 1
    assert new_stats["converted_leads"] >= 1
    assert new_stats["conversion_rate"] > 0

    # ---------------------------------------------------------
    # 9. View lead details
    # ---------------------------------------------------------
    details_resp = client.get(f"/api/v1/leads/{lead_id}", headers=auth_headers)
    assert details_resp.status_code == 200, f"Get lead details failed: {details_resp.text}"
    details = details_resp.json()
    assert details["id"] == lead_id
    assert details["name"] == lead_name
    assert details["company"] == "Apex Logistics Ltd"
    assert details["status"] == "Converted"
    assert details["created_at"] is not None
    assert details["updated_at"] is not None

    # ---------------------------------------------------------
    # 10. Delete the lead after confirmation
    # ---------------------------------------------------------
    del_resp = client.delete(f"/api/v1/leads/{lead_id}", headers=auth_headers)
    assert del_resp.status_code == 204, f"Delete lead failed: {del_resp.text}"

    # Verify lead no longer exists (404)
    verify_del_resp = client.get(f"/api/v1/leads/{lead_id}", headers=auth_headers)
    assert verify_del_resp.status_code == 404

    # ---------------------------------------------------------
    # 11. Log out & verify protected resources cannot be accessed
    # ---------------------------------------------------------
    logout_resp = client.post("/api/v1/auth/logout", headers=auth_headers)
    assert logout_resp.status_code == 200, f"Logout failed: {logout_resp.text}"
    assert "Successfully logged out" in logout_resp.json()["message"]

    # Verifying revoked token is rejected
    post_logout_me = client.get("/api/v1/auth/me", headers=auth_headers)
    assert post_logout_me.status_code == 401, "Revoked token should be rejected with 401"
    assert "revoked" in post_logout_me.json()["detail"].lower()

    # Verifying unauthenticated request is rejected
    no_auth_resp = client.get("/api/v1/leads")
    assert no_auth_resp.status_code == 401

    # ---------------------------------------------------------
    # 12. Verify that one user cannot access another user's leads
    # ---------------------------------------------------------
    # Create a fresh lead owned by User A
    user_a_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"tenant_a_{datetime.now(UTC).timestamp()}@swandigital.com",
            "full_name": "Tenant A",
            "password": password,
            "role": "USER",
        },
    )
    user_a_headers = {"Authorization": f"Bearer {user_a_reg.json()['access_token']}"}

    lead_a = client.post(
        "/api/v1/leads",
        json={"name": "Confidential Lead A", "email": "a@confidential.com"},
        headers=user_a_headers,
    ).json()
    lead_a_id = lead_a["id"]

    # Register User B
    user_b_reg = client.post(
        "/api/v1/auth/register",
        json={
            "email": f"tenant_b_{datetime.now(UTC).timestamp()}@swandigital.com",
            "full_name": "Tenant B",
            "password": password,
            "role": "USER",
        },
    )
    user_b_headers = {"Authorization": f"Bearer {user_b_reg.json()['access_token']}"}

    # User B attempts to read User A's lead -> 404 Not Found (no ID enumeration)
    resp_b_read = client.get(f"/api/v1/leads/{lead_a_id}", headers=user_b_headers)
    assert resp_b_read.status_code == 404, "User B should receive 404 for User A's lead"

    # User B attempts to edit User A's lead -> 404 Not Found
    resp_b_edit = client.patch(
        f"/api/v1/leads/{lead_a_id}",
        json={"name": "Hacked Name"},
        headers=user_b_headers,
    )
    assert resp_b_edit.status_code == 404

    # User B attempts to delete User A's lead -> 404 Not Found
    resp_b_del = client.delete(f"/api/v1/leads/{lead_a_id}", headers=user_b_headers)
    assert resp_b_del.status_code == 404
