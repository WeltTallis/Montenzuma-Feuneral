ALTER TABLE employees
  ADD COLUMN kra_pin varchar(11) NOT NULL DEFAULT '',
  ADD COLUMN nssf_number varchar(32) NOT NULL DEFAULT '',
  ADD COLUMN sha_number varchar(32) NOT NULL DEFAULT '';
