import uuid
from datetime import UTC, datetime, timedelta

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.db.session import SessionLocal, engine
from app.models.lead import Lead
from app.models.user import User


def seed_database():
    """Seed the database with standard demo users and realistic fictional leads."""
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        now = datetime.now(UTC)

        # 1. Create or get Demo User
        demo_user = (
            db.query(User)
            .filter(User.email == settings.DEMO_USER_EMAIL.lower())
            .first()
        )
        if not demo_user:
            demo_user = User(
                id=uuid.uuid4(),
                email=settings.DEMO_USER_EMAIL.lower(),
                full_name="Alex Mercer (Sales Executive)",
                password_hash=get_password_hash(settings.DEMO_USER_PASSWORD),
                role="USER",
                is_active=True,
            )
            db.add(demo_user)
            db.commit()
            db.refresh(demo_user)
            print(f"Created demo user: {demo_user.email}")
        else:
            print(f"Demo user already exists: {demo_user.email}")

        # 2. Create or get Demo Admin
        admin_user = (
            db.query(User)
            .filter(User.email == settings.DEMO_ADMIN_EMAIL.lower())
            .first()
        )
        if not admin_user:
            admin_user = User(
                id=uuid.uuid4(),
                email=settings.DEMO_ADMIN_EMAIL.lower(),
                full_name="Sarah Jenkins (Managing Director)",
                password_hash=get_password_hash(settings.DEMO_ADMIN_PASSWORD),
                role="ADMIN",
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            db.refresh(admin_user)
            print(f"Created admin user: {admin_user.email}")
        else:
            print(f"Admin user already exists: {admin_user.email}")

        # 3. Create or update Demo User's leads if none exist
        existing_leads_count = (
            db.query(Lead).filter(Lead.owner_id == demo_user.id).count()
        )
        if existing_leads_count == 0:
            demo_leads = [
                # New leads
                {
                    "name": "Marcus Vance",
                    "email": "marcus.vance@apexlogistics.com",
                    "phone_number": "+1-555-019-2831",
                    "company": "Apex Logistics",
                    "service_interested": "Custom CRM Integration",
                    "status": "New",
                    "follow_up_date": now + timedelta(days=2),
                    "notes": "Inquired via inbound website form. Looking to modernize tracking pipeline.",
                    "created_at": now - timedelta(days=1),
                },
                {
                    "name": "Elena Rostova",
                    "email": "elena@bluewavemedia.co",
                    "phone_number": "+1-555-014-9923",
                    "company": "BlueWave Media",
                    "service_interested": "SEO & Digital Strategy",
                    "status": "New",
                    "follow_up_date": now + timedelta(days=1),
                    "notes": "Fast growing marketing agency seeking performance marketing audit.",
                    "created_at": now - timedelta(days=2),
                },
                {
                    "name": "David Sterling",
                    "email": "dsterling@sterlingfintech.org",
                    "phone_number": "+1-555-018-7712",
                    "company": "Sterling FinTech",
                    "service_interested": "Cloud Migration & DevOps",
                    "status": "New",
                    "follow_up_date": now + timedelta(days=4),
                    "notes": "Evaluating AWS to GCP migration options. Security compliance is critical.",
                    "created_at": now - timedelta(hours=6),
                },
                # Contacted leads
                {
                    "name": "Sophia Chen",
                    "email": "schen@novahealth.io",
                    "phone_number": "+1-555-012-3344",
                    "company": "Nova Health Solutions",
                    "service_interested": "Full-Stack Web Platform",
                    "status": "Contacted",
                    "follow_up_date": now - timedelta(days=2),  # Overdue
                    "notes": "Had introductory call on Tuesday. Awaiting RFP document from their technical lead.",
                    "created_at": now - timedelta(days=6),
                },
                {
                    "name": "Liam Gallagher",
                    "email": "liam@gallagherbrands.com",
                    "phone_number": "+1-555-019-4455",
                    "company": "Gallagher Retail Brands",
                    "service_interested": "E-Commerce Optimization",
                    "status": "Contacted",
                    "follow_up_date": now - timedelta(days=1),  # Overdue
                    "notes": "Left voicemail following initial product inquiry. Sent follow-up brochure email.",
                    "created_at": now - timedelta(days=5),
                },
                {
                    "name": "Priya Patel",
                    "email": "priya@zenithretail.com",
                    "phone_number": "+1-555-017-8899",
                    "company": "Zenith Retail Tech",
                    "service_interested": "Full-Stack Web Platform",
                    "status": "Contacted",
                    "follow_up_date": now + timedelta(days=3),
                    "notes": "Scheduled architecture discovery session with CTO for Thursday afternoon.",
                    "created_at": now - timedelta(days=4),
                },
                # Qualified leads
                {
                    "name": "James Thornton",
                    "email": "jthornton@cybershieldlabs.net",
                    "phone_number": "+1-555-011-6677",
                    "company": "CyberShield Labs",
                    "service_interested": "Cybersecurity Audit & SecOps",
                    "status": "Qualified",
                    "follow_up_date": now + timedelta(days=2),
                    "notes": "Budget confirmed at $45,000. Decision maker meeting scheduled for next week.",
                    "created_at": now - timedelta(days=8),
                },
                {
                    "name": "Amina Al-Mansoor",
                    "email": "amina@omnicloud.ae",
                    "phone_number": "+971-50-555-1234",
                    "company": "OmniCloud Consulting",
                    "service_interested": "Cloud Migration & DevOps",
                    "status": "Qualified",
                    "follow_up_date": now + timedelta(days=5),
                    "notes": "Passed technical validation. Commercial proposal in preparation.",
                    "created_at": now - timedelta(days=7),
                },
                {
                    "name": "Oliver Twist",
                    "email": "oliver@skylineestates.co.uk",
                    "phone_number": "+44-20-7946-0912",
                    "company": "Skyline Real Estate",
                    "service_interested": "Mobile App Development",
                    "status": "Qualified",
                    "follow_up_date": now - timedelta(hours=12),  # Overdue
                    "notes": "Urgent requirement for iOS/Android property portal. High intent buyer.",
                    "created_at": now - timedelta(days=9),
                },
                # Converted leads
                {
                    "name": "Rachel Adams",
                    "email": "rachel@pulseanalytics.com",
                    "phone_number": "+1-555-016-5522",
                    "company": "Pulse Analytics",
                    "service_interested": "Custom CRM Integration",
                    "status": "Converted",
                    "follow_up_date": None,
                    "notes": "Contract signed ($62,000 annual contract). Onboarding meeting scheduled.",
                    "created_at": now - timedelta(days=12),
                },
                {
                    "name": "Daniel Kim",
                    "email": "dkim@quantumrobotics.io",
                    "phone_number": "+1-555-015-7733",
                    "company": "Quantum Robotics",
                    "service_interested": "Full-Stack Web Platform",
                    "status": "Converted",
                    "follow_up_date": None,
                    "notes": "Deal closed! Kickoff sprint begins next Monday.",
                    "created_at": now - timedelta(days=11),
                },
                {
                    "name": "Claire Redfield",
                    "email": "claire@terrasave.org",
                    "phone_number": "+1-555-013-4411",
                    "company": "TerraSave Media",
                    "service_interested": "SEO & Digital Strategy",
                    "status": "Converted",
                    "follow_up_date": None,
                    "notes": "Quarterly retainer agreed at $8,500/month.",
                    "created_at": now - timedelta(days=13),
                },
                # Lost leads
                {
                    "name": "Gregory House",
                    "email": "ghouse@princetonhealth.edu",
                    "phone_number": "+1-555-019-8800",
                    "company": "Princeton Diagnostic Group",
                    "service_interested": "Custom CRM Integration",
                    "status": "Lost",
                    "follow_up_date": None,
                    "notes": "Chose an internal legacy solution due to departmental freeze.",
                    "created_at": now - timedelta(days=10),
                },
                {
                    "name": "Arthur Pendelton",
                    "email": "arthur@camelotconsulting.com",
                    "phone_number": "+1-555-018-9944",
                    "company": "Camelot Consulting",
                    "service_interested": "Mobile App Development",
                    "status": "Lost",
                    "follow_up_date": None,
                    "notes": "Project indefinitely postponed due to corporate restructuring.",
                    "created_at": now - timedelta(days=14),
                },
            ]

            for item in demo_leads:
                lead = Lead(
                    id=uuid.uuid4(),
                    owner_id=demo_user.id,
                    name=item["name"],
                    email=item["email"],
                    phone_number=item["phone_number"],
                    company=item["company"],
                    service_interested=item["service_interested"],
                    source=item.get("source", "Website Inbound"),
                    status=item["status"],
                    follow_up_date=item["follow_up_date"],
                    notes=item["notes"],
                    created_at=item["created_at"],
                )
                db.add(lead)

            db.commit()
            print(
                f"Successfully seeded {len(demo_leads)} demo leads for {demo_user.email}!"
            )
        else:
            print(
                f"Leads already present for {demo_user.email} ({existing_leads_count} found)."
            )

    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
