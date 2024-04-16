CREATE TABLE IF NOT EXISTS public.billing_group
(
    id integer NOT NULL DEFAULT nextval('billing_group_id_seq'::regclass),
    title character varying(30) COLLATE pg_catalog."default",
    description character varying(45) COLLATE pg_catalog."default",
    category character varying(20) COLLATE pg_catalog."default",
    CONSTRAINT billing_group_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.billing_group
    OWNER to postgres;

CREATE TABLE IF NOT EXISTS public.items
(
    id integer NOT NULL DEFAULT nextval('items_id_seq'::regclass),
    description character varying(45) COLLATE pg_catalog."default",
    price double precision,
    user_id integer,
    billing_group_id integer,
    CONSTRAINT items_pkey PRIMARY KEY (id),
    CONSTRAINT items_billing_group_id_fkey FOREIGN KEY (billing_group_id)
        REFERENCES public.billing_group (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT items_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.items
    OWNER to postgres;

    CREATE TABLE IF NOT EXISTS public.users
(
    id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
    name character varying(45) COLLATE pg_catalog."default",
    CONSTRAINT users_pkey PRIMARY KEY (id)
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users
    OWNER to postgres;


    CREATE TABLE IF NOT EXISTS public.users_billing_group
(
    user_id integer NOT NULL,
    billing_group_id integer NOT NULL,
    CONSTRAINT users_billing_group_pkey PRIMARY KEY (billing_group_id, user_id),
    CONSTRAINT users_billing_group_billing_group_id_fkey FOREIGN KEY (billing_group_id)
        REFERENCES public.billing_group (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION,
    CONSTRAINT users_billing_group_user_id_fkey FOREIGN KEY (user_id)
        REFERENCES public.users (id) MATCH SIMPLE
        ON UPDATE NO ACTION
        ON DELETE NO ACTION
)

TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.users_billing_group
    OWNER to postgres;