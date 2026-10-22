from fastapi.testclient import TestClient


def test_user_cannot_read_another_users_lead(
    client: TestClient, user_a_headers: dict, user_b_headers: dict
):
    # User A creates a lead
    resp = client.post(
        "/api/v1/leads",
        json={"name": "Confidential Lead", "email": "confidential@example.com"},
        headers=user_a_headers,
    )
    lead_id = resp.json()["id"]

    # User B attempts to get User A's lead -> returns 404 (preventing ID enumeration)
    get_resp = client.get(f"/api/v1/leads/{lead_id}", headers=user_b_headers)
    assert get_resp.status_code == 404


def test_user_cannot_update_another_users_lead(
    client: TestClient, user_a_headers: dict, user_b_headers: dict
):
    # User A creates a lead
    resp = client.post(
        "/api/v1/leads",
        json={"name": "Alpha Lead", "email": "alpha@example.com"},
        headers=user_a_headers,
    )
    lead_id = resp.json()["id"]

    # User B attempts to patch User A's lead -> returns 404
    patch_resp = client.patch(
        f"/api/v1/leads/{lead_id}",
        json={"name": "Hacked Name"},
        headers=user_b_headers,
    )
    assert patch_resp.status_code == 404


def test_user_cannot_delete_another_users_lead(
    client: TestClient, user_a_headers: dict, user_b_headers: dict
):
    # User A creates a lead
    resp = client.post(
        "/api/v1/leads",
        json={"name": "Alpha Delete Lead", "email": "alphadel@example.com"},
        headers=user_a_headers,
    )
    lead_id = resp.json()["id"]

    # User B attempts to delete User A's lead -> returns 404
    del_resp = client.delete(f"/api/v1/leads/{lead_id}", headers=user_b_headers)
    assert del_resp.status_code == 404

    # Verify User A can still access it
    verify_resp = client.get(f"/api/v1/leads/{lead_id}", headers=user_a_headers)
    assert verify_resp.status_code == 200


def test_admin_can_view_all_leads(
    client: TestClient, user_a_headers: dict, admin_headers: dict
):
    # User A creates a lead
    client.post(
        "/api/v1/leads",
        json={"name": "Admin Visible Lead", "email": "adminvis@example.com"},
        headers=user_a_headers,
    )

    # Admin requests with view_all=true
    admin_resp = client.get("/api/v1/leads?view_all=true", headers=admin_headers)
    assert admin_resp.status_code == 200
    items = admin_resp.json()["items"]
    assert any(lead_item["name"] == "Admin Visible Lead" for lead_item in items)
