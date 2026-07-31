/**
 * Migration: Add signature column to next_of_kin table
 * Date: 2024-07-31
 * Description: Adds a signature column to store the next of kin's signature image
 */

exports.up = function(knex) {
    return knex.schema.alterTable('next_of_kin', function(table) {
        table.text('signature').nullable().after('alternative_contact');
    });
};

exports.down = function(knex) {
    return knex.schema.alterTable('next_of_kin', function(table) {
        table.dropColumn('signature');
    });
};