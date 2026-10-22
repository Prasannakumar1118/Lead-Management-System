from fastapi.testclient import TestClient


def test_create_lead_success(client: TestClient, user_a_headers: dict):
    payload = {
        "name": "Jane Doe",
        "email": "jane.doe@example.com",
        "phone_number": "+1-555-123-4567",
        "company": "Doe Enterprises",
        "service_interested": "Full-Stack Web Platform",
        "status": "New",
        "notes": "Interested in 3-month rollout.",
    }
    response = client.post("/api/v1/leads", json=payload, headers=user_a_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Jane Doe"
    assert data["email"] == "jane.doe@example.com"
    assert data["status"] == "New"
    assert "id" in data
    assert "owner_id" in data


def test_create_lead_missing_contact_fails(client: TestClient, user_a_headers: dict):
    # Both email and phone_number missing should fail validation
    payload = {
        "name": "No Contact Info",
        "company": "Ghost LLC",
        "status": "New",
    }
    response = client.post("/api/v1/leads", json=payload, headers=user_a_headers)
    assert response.status_code == 422


def test_get_and_update_lead(client: TestClient, user_a_headers: dict):
    # Create lead
    create_resp = client.post(
        "/api/v1/leads",
        json={"name": "Bob Smith", "email": "bob@example.com"},
        headers=user_a_headers,
    )
    lead_id = create_resp.json()["id"]

    # Get lead
    get_resp = client.get(f"/api/v1/leads/{lead_id}", headers=user_a_headers)
    assert get_resp.status_code == 200
    assert get_resp.json()["name"] == "Bob Smith"

    # Update lead status to Contacted
    patch_resp = client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"status": "Contacted", "notes": "Had introductory sync."},
        headers=user_a_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["status"] == "Contacted"
    assert patch_resp.json()["notes"] == "Had introductory sync."


def test_delete_lead(client: TestClient, user_a_headers: dict):
    create_resp = client.post(
        "/api/v1/leads",
        json={"name": "To Delete", "email": "delete_me@example.com"},
        headers=user_a_headers,
    )
    lead_id = create_resp.json()["id"]

    # Delete
    del_resp = client.delete(f"/api/v1/leads/{lead_id}", headers=user_a_headers)
    assert del_resp.status_code == 204

    # Verify not found
    get_resp = client.get(f"/api/v1/leads/{lead_id}", headers=user_a_headers)
    assert get_resp.status_code == 404


def test_search_and_filter_leads(client: TestClient, user_a_headers: dict):
    # Create distinct leads
    client.post(
        "/api/v1/leads",
        json={"name": "Alice Cyber", "email": "alice@cyber.com", "status": "New"},
        headers=user_a_headers,
    )
    client.post(
        "/api/v1/leads",
        json={"name": "Bob Quantum", "email": "bob@quantum.com", "status": "Qualified"},
        headers=user_a_headers,
    )

    # Search for "Cyber"
    search_resp = client.get("/api/v1/leads?search=Cyber", headers=user_a_headers)
    assert search_resp.status_code == 200
    items = search_resp.json()["items"]
    assert any("Cyber" in lead_item["name"] for lead_item in items)
    assert not any("Quantum" in lead_item["name"] for lead_item in items)

    # Filter by status "Qualified"
    filter_resp = client.get("/api/v1/leads?status=Qualified", headers=user_a_headers)
    assert filter_resp.status_code == 200
    for lead_item in filter_resp.json()["items"]:
        assert lead_item["status"] == "Qualified"


def test_leads_pagination(client: TestClient, user_a_headers: dict):
    # Create multiple leads
    for i in range(5):
        client.post(
            "/api/v1/leads",
            json={"name": f"Paging Lead {i}", "email": f"paging{i}@example.com"},
            headers=user_a_headers,
        )

    # Fetch page 1 with page_size=2
    resp = client.get("/api/v1/leads?page=1&page_size=2", headers=user_a_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["items"]) == 2
    assert data["page"] == 1
    assert data["page_size"] == 2
    assert data["total"] >= 5


def test_export_leads_csv(client: TestClient, user_a_headers: dict):
    client.post(
        "/api/v1/leads",
        json={"name": "CSV Export Lead", "email": "csvexport@example.com"},
        headers=user_a_headers,
    )
    resp = client.get("/api/v1/leads/export/csv", headers=user_a_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    assert "CSV Export Lead" in resp.text


def test_create_and_update_lead_source(client: TestClient, user_a_headers: dict):
    create_resp = client.post(
        "/api/v1/leads",
        json={
            "name": "Sourced Lead",
            "email": "sourced@example.com",
            "source": "LinkedIn",
        },
        headers=user_a_headers,
    )
    assert create_resp.status_code == 201
    lead_id = create_resp.json()["id"]
    assert create_resp.json()["source"] == "LinkedIn"

    # Update source
    patch_resp = client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"source": "Referral"},
        headers=user_a_headers,
    )
    assert patch_resp.status_code == 200
    assert patch_resp.json()["source"] == "Referral"


def test_export_leads_csv_sanitizes_formula_injection(client: TestClient, user_a_headers: dict):
    # Test CWE-1236: CSV Formula Injection protection
    dangerous_name = "=cmd|' /C calc'!A0"
    client.post(
        "/api/v1/leads",
        json={"name": dangerous_name, "email": "exploit@example.com"},
        headers=user_a_headers,
    )
    resp = client.get("/api/v1/leads/export/csv", headers=user_a_headers)
    assert resp.status_code == 200
    # Sanitize prefix single quote should be prepended
    assert f"'{dangerous_name}" in resp.text

