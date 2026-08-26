"""Admin models, inventory transactions, coupons, audit logs, and settings

Revision ID: 002_admin_models
Revises: 001_initial_schema
Create Date: 2026-08-21 21:45:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '002_admin_models'
down_revision: Union[str, None] = '001_initial_schema'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add low_stock_threshold to products
    op.add_column('products', sa.Column('low_stock_threshold', sa.Integer(), nullable=False, server_default='10'))

    # 2. admin_audit_logs
    op.create_table(
        'admin_audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('admin_user_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=50), nullable=False),
        sa.Column('entity_id', sa.String(length=50), nullable=True),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_admin_audit_logs_id'), 'admin_audit_logs', ['id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_action'), 'admin_audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_entity_type'), 'admin_audit_logs', ['entity_type'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_entity_id'), 'admin_audit_logs', ['entity_id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_admin_user_id'), 'admin_audit_logs', ['admin_user_id'], unique=False)
    op.create_index(op.f('ix_admin_audit_logs_created_at'), 'admin_audit_logs', ['created_at'], unique=False)

    # 3. inventory_transactions
    op.create_table(
        'inventory_transactions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('admin_user_id', sa.Integer(), nullable=True),
        sa.Column('change_quantity', sa.Integer(), nullable=False),
        sa.Column('previous_quantity', sa.Integer(), nullable=False),
        sa.Column('new_quantity', sa.Integer(), nullable=False),
        sa.Column('reason', sa.String(length=50), nullable=False),
        sa.Column('notes', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['admin_user_id'], ['users.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['product_id'], ['products.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_inventory_transactions_id'), 'inventory_transactions', ['id'], unique=False)
    op.create_index(op.f('ix_inventory_transactions_product_id'), 'inventory_transactions', ['product_id'], unique=False)
    op.create_index(op.f('ix_inventory_transactions_admin_user_id'), 'inventory_transactions', ['admin_user_id'], unique=False)
    op.create_index(op.f('ix_inventory_transactions_reason'), 'inventory_transactions', ['reason'], unique=False)
    op.create_index(op.f('ix_inventory_transactions_created_at'), 'inventory_transactions', ['created_at'], unique=False)

    # 4. coupons
    op.create_table(
        'coupons',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('discount_type', sa.String(length=20), nullable=False, default='percentage'),
        sa.Column('discount_value', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('minimum_order', sa.Numeric(precision=10, scale=2), nullable=False, default=0),
        sa.Column('maximum_discount', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.Column('usage_limit', sa.Integer(), nullable=False, default=1000),
        sa.Column('used_count', sa.Integer(), nullable=False, default=0),
        sa.Column('per_user_limit', sa.Integer(), nullable=False, default=1),
        sa.Column('start_date', sa.DateTime(), nullable=True),
        sa.Column('end_date', sa.DateTime(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_coupons_id'), 'coupons', ['id'], unique=False)
    op.create_index(op.f('ix_coupons_code'), 'coupons', ['code'], unique=True)
    op.create_index(op.f('ix_coupons_is_active'), 'coupons', ['is_active'], unique=False)

    # 5. store_settings
    op.create_table(
        'store_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('key', sa.String(length=100), nullable=False),
        sa.Column('value', sa.Text(), nullable=False),
        sa.Column('description', sa.String(length=255), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_store_settings_id'), 'store_settings', ['id'], unique=False)
    op.create_index(op.f('ix_store_settings_key'), 'store_settings', ['key'], unique=True)


def downgrade() -> None:
    op.drop_table('store_settings')
    op.drop_table('coupons')
    op.drop_table('inventory_transactions')
    op.drop_table('admin_audit_logs')
    op.drop_column('products', 'low_stock_threshold')
