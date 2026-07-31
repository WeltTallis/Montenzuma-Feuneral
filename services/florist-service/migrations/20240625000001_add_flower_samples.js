/**
 * Add flower_samples table for flower arrangements
 */

export const up = async (knex) => {
    return knex.schema.createTable('flower_samples', (table) => {
        table.increments('id').primary();
        table.string('sample_id', 50).unique().notNullable();
        table.string('title', 255).notNullable();
        table.text('description');
        table.json('types'); // Array of types: ['Sympathy Arrangement', 'Funeral Wreath', etc.]
        table.json('colors'); // Array of colors: ['white', 'red', 'mixed', etc.]
        table.json('sizes'); // Array of sizes: ['small', 'medium', 'large'] or numeric
        table.json('images'); // Array of image objects: [{url, alt_text, is_primary, order}]
        table.string('tenant_slug', 100).notNullable().index();
        table.timestamps(true, true);
        
        // Add index for tenant queries
        table.index(['tenant_slug', 'sample_id']);
    });
};

export const down = async (knex) => {
    return knex.schema.dropTableIfExists('flower_samples');
};