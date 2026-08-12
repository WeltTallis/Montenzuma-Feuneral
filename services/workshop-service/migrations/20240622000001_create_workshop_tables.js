/**
 * Create workshop tables - Coffin building, materials, and production tracking
 * Multi-tenant: Each funeral home gets its own database
 */

export async function up(knex) {
  // Users table (workers, managers, admins)
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.string('first_name', 100).notNullable();
    table.string('last_name', 100).notNullable();
    table.string('role', 50).defaultTo('worker');
    table.string('created_at', 255);
    table.string('updated_at', 255);
    table.index(['role'], 'idx_users_role');
  });

  // Coffin orders
  await knex.schema.createTable('coffin_orders', (table) => {
    table.increments('id').primary();
    table.string('order_number', 50).unique().notNullable();
    table.string('coffin_name', 255).notNullable();
    table.string('coffin_type', 50).defaultTo('standard');
    table.string('color', 100);
    table.string('interior_fabric', 100);
    table.text('notes');
    table.text('instructions');
    table.date('due_date');
    table.string('priority', 20).defaultTo('normal');
    table.integer('branch_id');
    table.text('hold_reason');
    table.string('created_by', 255);
    table.string('status', 50).defaultTo('pending');
    table.date('delivery_date');
    table.string('order_date', 255);
    table.string('created_at', 255);
    table.string('updated_at', 255);
    table.index(['status'], 'idx_orders_status');
    table.index(['order_date'], 'idx_orders_date');
    table.index(['branch_id'], 'idx_orders_branch');
  });

  // Materials inventory
  await knex.schema.createTable('materials', (table) => {
    table.increments('id').primary();
    table.string('name', 255).notNullable();
    table.string('category', 100).notNullable();
    table.string('unit', 50).notNullable().defaultTo('pieces');
    table.decimal('quantity', 10, 2).notNullable().defaultTo(0);
    table.decimal('unit_price', 10, 2).defaultTo(0);
    table.decimal('min_stock_level', 10, 2).defaultTo(0);
    table.text('description');
    table.string('created_at', 255);
    table.string('updated_at', 255);
    table.index(['category'], 'idx_materials_category');
  });

  // Material usage tracking
  await knex.schema.createTable('material_usage', (table) => {
    table.increments('id').primary();
    table.integer('coffin_order_id').unsigned().notNullable();
    table.integer('material_id').unsigned().notNullable();
    table.decimal('quantity_used', 10, 2).notNullable();
    table.decimal('unit_cost', 10, 2).defaultTo(0);
    table.text('notes');
    table.string('used_at', 255);
    table.foreign('coffin_order_id').references('coffin_orders.id').onDelete('CASCADE');
    table.foreign('material_id').references('materials.id').onDelete('CASCADE');
    table.index(['coffin_order_id'], 'idx_usage_order');
    table.index(['material_id'], 'idx_usage_material');
  });

  // Production stages
  await knex.schema.createTable('production_stages', (table) => {
    table.increments('id').primary();
    table.integer('coffin_order_id').unsigned().notNullable();
    table.string('stage', 50).notNullable();
    table.string('status', 50).defaultTo('pending');
    table.string('started_at', 255);
    table.string('completed_at', 255);
    table.text('notes');
    table.foreign('coffin_order_id').references('coffin_orders.id').onDelete('CASCADE');
    table.unique(['coffin_order_id', 'stage'], 'uk_order_stage');
    table.index(['coffin_order_id'], 'idx_stages_order');
  });

  // Worker assignments
  await knex.schema.createTable('worker_assignments', (table) => {
    table.increments('id').primary();
    table.integer('coffin_order_id').unsigned().notNullable();
    table.integer('user_id').unsigned().notNullable();
    table.string('stage', 50).notNullable();
    table.decimal('hours_worked', 5, 2).defaultTo(0);
    table.text('notes');
    table.string('assigned_at', 255);
    table.string('completed_at', 255);
    table.foreign('coffin_order_id').references('coffin_orders.id').onDelete('CASCADE');
    table.index(['coffin_order_id'], 'idx_assignments_order');
    table.index(['user_id'], 'idx_assignments_user');
  });


}

