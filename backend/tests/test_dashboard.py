from datetime import UTC, datetime, timedelta

from fastapi.testclient import TestClient


def test_dashboard_stats_and_conversion_rate(client: TestClient, user_a_headers: dict):
    # Create known lead distribution for User A:
    # 2 New, 1 Qualified, 1 Converted = 4 total leads
    client.post(
        "/api/v1/leads",
        json={"name": "L1", "email": "l1@a.com", "status": "New"},
        headers=user_a_headers,
    )
    client.post(
        "/api/v1/leads",
        json={"name": "L2", "email": "l2@a.com", "status": "New"},
        headers=user_a_headers,
    )
    client.post(
        "/api/v1/leads",
        json={"name": "L3", "email": "l3@a.com", "status": "Qualified"},
        headers=user_a_headers,
    )
    client.post(
        "/api/v1/leads",
        json={"name": "L4", "email": "l4@a.com", "status": "Converted"},
        headers=user_a_headers,
    )

    response = client.get("/api/v1/dashboard/stats", headers=user_a_headers)
    assert response.status_code == 200
    data = response.json()

    assert data["total_leads"] >= 4
    assert data["new_leads"] >= 2
    assert data["qualified_leads"] >= 1
    assert data["converted_leads"] >= 1

    # Conversion rate must match Converted / Total * 100
    expected_rate = round(data["converted_leads"] / data["total_leads"] * 100, 2)
    assert data["conversion_rate"] == expected_rate


def test_dashboard_charts(client: TestClient, user_a_headers: dict):
    response = client.get("/api/v1/dashboard/charts", headers=user_a_headers)
    assert response.status_code == 200
    data = response.json()
    assert "distribution" in data
    assert "trend" in data
    assert len(data["distribution"]) == 5  # New, Contacted, Qualified, Converted, Lost
    assert len(data["trend"]) == 14  # 14 days time series


def test_follow_up_alerts(client: TestClient, user_a_headers: dict):
    now = datetime.now(UTC)
    # Overdue lead
    client.post(
        "/api/v1/leads",
        json={
            "name": "Overdue Lead",
            "email": "overdue@test.com",
            "status": "Contacted",
            "follow_up_date": (now - timedelta(days=2)).isoformat(),
        },
        headers=user_a_headers,
    )
    # Upcoming lead
    client.post(
        "/api/v1/leads",
        json={
            "name": "Upcoming Lead",
            "email": "upcoming@test.com",
            "status": "Contacted",
            "follow_up_date": (now + timedelta(days=2)).isoformat(),
        },
        headers=user_a_headers,
    )

    response = client.get("/api/v1/dashboard/follow-ups", headers=user_a_headers)
    assert response.status_code == 200
    data = response.json()
    assert "upcoming" in data
    assert "overdue" in data
    assert any(item["name"] == "Overdue Lead" for item in data["overdue"])
    assert any(item["name"] == "Upcoming Lead" for item in data["upcoming"])
