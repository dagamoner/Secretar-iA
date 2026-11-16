"""Initial multi-area tracking schema

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-11-13 13:40:00.000000

"""
from alembic import op
import sqlalchemy as sa

revision = '001_initial_schema'
down_revision = None
branch_labels = None
depends_on = None

def upgrade() -> None:
    # 1. Areas
    op.create_table(
        'areas',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=150), nullable=False),
        sa.Column('codigo', sa.String(length=20), nullable=False),
        sa.Column('descripcion', sa.Text(), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nombre'),
        sa.UniqueConstraint('codigo')
    )
    op.create_index(op.f('ix_areas_codigo'), 'areas', ['codigo'], unique=True)
    op.create_index(op.f('ix_areas_id'), 'areas', ['id'], unique=False)

    # 2. Usuarios
    op.create_table(
        'usuarios',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=50), nullable=False),
        sa.Column('nombre_completo', sa.String(length=150), nullable=False),
        sa.Column('rol', sa.String(length=30), nullable=False, server_default='OPERADOR'),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('username')
    )
    op.create_index(op.f('ix_usuarios_area_id'), 'usuarios', ['area_id'], unique=False)
    op.create_index(op.f('ix_usuarios_id'), 'usuarios', ['id'], unique=False)

    # 3. Catalogos Destinos
    op.create_table(
        'catalogos_destinos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=False),
        sa.Column('nombre', sa.String(length=150), nullable=False),
        sa.Column('responsable_defecto', sa.String(length=150), nullable=True),
        sa.Column('activo', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_catalogos_destinos_area_id'), 'catalogos_destinos', ['area_id'], unique=False)

    # 4. Documentos
    op.create_table(
        'documentos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=False),
        sa.Column('numero_expediente', sa.String(length=80), nullable=False),
        sa.Column('tipo_documento', sa.String(length=40), nullable=False, server_default='EXPEDIENTE'),
        sa.Column('anio', sa.Integer(), nullable=False),
        sa.Column('iniciador_caratula', sa.String(length=255), nullable=False),
        sa.Column('extracto', sa.Text(), nullable=True),
        sa.Column('estado_actual', sa.String(length=50), nullable=False, server_default='INICIADO'),
        sa.Column('destino_actual', sa.String(length=150), nullable=False, server_default='Mesa de Entradas'),
        sa.Column('portador_actual', sa.String(length=150), nullable=False, server_default='Mesa de Entradas'),
        sa.Column('foja_actual', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('prioridad', sa.String(length=30), nullable=False, server_default='NORMAL'),
        sa.Column('fecha_ingreso', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('ultimo_movimiento_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('creado_por_id', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['creado_por_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_docs_area_num', 'documentos', ['area_id', 'numero_expediente'], unique=False)
    op.create_index('ix_docs_area_estado', 'documentos', ['area_id', 'estado_actual'], unique=False)
    op.create_index(op.f('ix_documentos_area_id'), 'documentos', ['area_id'], unique=False)
    op.create_index(op.f('ix_documentos_numero_expediente'), 'documentos', ['numero_expediente'], unique=False)

    # 5. Movimientos
    op.create_table(
        'movimientos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('documento_id', sa.Integer(), nullable=False),
        sa.Column('area_id', sa.Integer(), nullable=False),
        sa.Column('usuario_id', sa.Integer(), nullable=True),
        sa.Column('usuario_nombre', sa.String(length=150), nullable=False),
        sa.Column('estado_anterior', sa.String(length=50), nullable=True),
        sa.Column('estado_nuevo', sa.String(length=50), nullable=False),
        sa.Column('destino_anterior', sa.String(length=150), nullable=True),
        sa.Column('destino_nuevo', sa.String(length=150), nullable=False),
        sa.Column('portador_anterior', sa.String(length=150), nullable=True),
        sa.Column('portador_nuevo', sa.String(length=150), nullable=False),
        sa.Column('fojas_agregadas', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('observacion', sa.Text(), nullable=True),
        sa.Column('fecha_hora', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['area_id'], ['areas.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['documento_id'], ['documentos.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['usuario_id'], ['usuarios.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_mov_doc_fecha', 'movimientos', ['documento_id', 'fecha_hora'], unique=False)
    op.create_index(op.f('ix_movimientos_area_id'), 'movimientos', ['area_id'], unique=False)
    op.create_index(op.f('ix_movimientos_documento_id'), 'movimientos', ['documento_id'], unique=False)

def downgrade() -> None:
    op.drop_table('movimientos')
    op.drop_table('documentos')
    op.drop_table('catalogos_destinos')
    op.drop_table('usuarios')
    op.drop_table('areas')
