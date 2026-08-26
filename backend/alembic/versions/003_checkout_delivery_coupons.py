"""Checkout, delivery zones, coupon usages, and order updates

Revision ID: 003_checkout_delivery_coupons
Revises: 002_admin_models
Create Date: 2026-08-21 23:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '003_checkout_delivery_coupons'
down_revision: Union[str, None] = '002_admin_models'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. delivery_zones table
    op.create_table(
        'delivery_zones',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('pincodes', sa.Text(), nullable=False),
        sa.Column('city', sa.String(length=100), nullable=False, server_default='Satnali'),
        sa.Column('state', sa.String(length=100), nullable=False, server_default='Haryana'),
        sa.Column('delivery_fee', sa.Numeric(precision=10, scale=2), nullable=False, server_default='30.00'),
        sa.Column('free_delivery_threshold', sa.Numeric(precision=10, scale=2), nullable=False, server_default='499.00'),
        sa.Column('minimum_order', sa.Numeric(precision=10, scale=2), nullable=False, server_default='99.00'),
        sa.Column('estimated_min_minutes', sa.Integer(), nullable=False, server_default='30'),
        sa.Column('estimated_max_minutes', sa.Integer(), nullable=False, server_default='60'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_delivery_zones_id'), 'delivery_zones', ['id'], unique=False)
    op.create_index(op.f('ix_delivery_zones_is_active'), 'delivery_zones', ['is_active'], unique=False)

    # 2. Add columns to orders
    op.add_column('orders', sa.Column('delivery_zone_id', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('estimated_delivery', sa.String(length=100), nullable=True))
    op.add_column('orders', sa.Column('coupon_id', sa.Integer(), nullable=True))
    op.add_column('orders', sa.Column('coupon_code', sa.String(length=50), nullable=True))
    op.add_column('orders', sa.Column('idempotency_key', sa.String(length=100), nullable=True))
    op.add_column('order_items', sa.Column('sku', sa.String(length=100), nullable=True))

    op.create_foreign_key('fk_orders_delivery_zone_id', 'orders', 'delivery_zones', ['delivery_zone_id'], ['id'], ondelete='SET NULL')
    op.create_foreign_key('fk_orders_coupon_id', 'orders', 'coupons', ['coupon_id'], ['id'], ondelete='SET NULL')
    op.create_index(op.f('ix_orders_idempotency_key'), 'orders', ['idempotency_key'], unique=True)

    # 3. coupon_usages table
    op.create_table(
        'coupon_usages',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('coupon_id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('order_id', sa.Integer(), nullable=True),
        sa.Column('discount_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['coupon_id'], ['coupons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['order_id'], ['orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_coupon_usages_id'), 'coupon_usages', ['id'], unique=False)
    op.create_index(op.f('ix_coupon_usages_coupon_id'), 'coupon_usages', ['coupon_id'], unique=False)
    op.create_index(op.f('ix_coupon_usages_user_id'), 'coupon_usages', ['user_id'], unique=False)
    op.create_index(op.f('ix_coupon_usages_order_id'), 'coupon_usages', ['order_id'], unique=False)


def downgrade() -> None:
    op.drop_table('coupon_usages')
    op.drop_index(op.f('ix_orders_idempotency_key'), table_name='orders')
    op.drop_constraint('fk_orders_coupon_id', 'orders', type_='foreignkey')
    op.drop_constraint('fk_orders_delivery_zone_id', 'orders', type_='foreignkey')
    op.drop_column('order_items', 'sku')
    op.drop_column('orders', 'idempotency_key')
    op.drop_column('orders', 'coupon_code')
    op.drop_column('orders', 'coupon_id')
    op.drop_column('orders', 'estimated_delivery')
    op.drop_column('orders', 'delivery_zone_id')
    op.drop_table('delivery_zones')
