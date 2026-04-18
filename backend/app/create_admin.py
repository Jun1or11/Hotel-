"""
create_admin.py - Script para crear un usuario administrador inicial.

Uso:
  python app/create_admin.py

Crea un usuario con:
  Email: admin1@hotelnova.com
  Contraseña: Promocion135
  Rol: admin
"""

from sqlalchemy.orm import Session

from app.database import SessionLocal, init_db
from app.core.config import get_settings
from app.models import Usuario, RolEnum
from app.core.security import hash_password
from app.crud.usuario import get_user_by_email


ADMIN_EMAIL = "admin1@hotelnova.com"
ADMIN_PASSWORD = "Promocion135"


def create_admin_user():
    settings = get_settings()
    print(f"Using database URL: {settings.database_url.split('@')[-1]}")

    init_db()
    db = SessionLocal()
    try:
        # Si ya existe un admin con el nuevo email, actualiza datos críticos.
        existing_admin = get_user_by_email(db, ADMIN_EMAIL)
        if existing_admin:
            existing_admin.nombre = "Administrador"
            existing_admin.password_hash = hash_password(ADMIN_PASSWORD)
            existing_admin.rol = RolEnum.admin
            existing_admin.activo = True
            db.add(existing_admin)
            db.commit()
            db.refresh(existing_admin)
            print("✓ Admin user updated successfully!")
            print(f"  Email: {ADMIN_EMAIL}")
            print(f"  Password: {ADMIN_PASSWORD}")
            print("  Role: admin")
            print(f"  User ID: {existing_admin.id}")
            return

        # Si existe otro admin con email anterior, se migra al nuevo email y contraseña.
        legacy_admin = db.query(Usuario).filter(Usuario.rol == RolEnum.admin).first()
        if legacy_admin:
            legacy_admin.nombre = "Administrador"
            legacy_admin.email = ADMIN_EMAIL
            legacy_admin.password_hash = hash_password(ADMIN_PASSWORD)
            legacy_admin.rol = RolEnum.admin
            legacy_admin.activo = True
            db.add(legacy_admin)
            db.commit()
            db.refresh(legacy_admin)
            print("✓ Legacy admin migrated successfully!")
            print(f"  Email: {ADMIN_EMAIL}")
            print(f"  Password: {ADMIN_PASSWORD}")
            print("  Role: admin")
            print(f"  User ID: {legacy_admin.id}")
            return

        # Crea el usuario admin
        admin_user = Usuario(
            nombre="Administrador",
            email=ADMIN_EMAIL,
            password_hash=hash_password(ADMIN_PASSWORD),
            rol=RolEnum.admin,
            activo=True,
        )
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)

        print(f"✓ Admin user created successfully!")
        print(f"  Email: {ADMIN_EMAIL}")
        print(f"  Password: {ADMIN_PASSWORD}")
        print(f"  Role: admin")
        print(f"  User ID: {admin_user.id}")

    except Exception as e:
        print(f"✗ Error creating admin user: {str(e)}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    create_admin_user()
