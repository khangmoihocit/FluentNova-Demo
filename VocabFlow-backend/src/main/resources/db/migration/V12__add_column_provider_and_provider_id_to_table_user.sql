alter table users add column provider varchar(50) default 'LOCAL';
alter table users add column provider_id varchar(255);