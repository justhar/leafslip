CREATE TABLE "surplus_listings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"product_id" integer,
	"source_type" varchar(20) DEFAULT 'manual' NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"unit_label" varchar(50) DEFAULT 'item' NOT NULL,
	"quantity" integer NOT NULL,
	"remaining_quantity" integer NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "surplus_reservations" (
	"id" serial PRIMARY KEY NOT NULL,
	"listing_id" integer NOT NULL,
	"guest_name" varchar(255) NOT NULL,
	"guest_email" varchar(255),
	"guest_phone" varchar(30),
	"confirmation_code" varchar(32) NOT NULL,
	"quantity" integer NOT NULL,
	"status" varchar(20) DEFAULT 'pending' NOT NULL,
	"pickup_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "surplus_reservations_confirmation_code_unique" UNIQUE("confirmation_code")
);
--> statement-breakpoint
CREATE TABLE "token_usage_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"call_site" varchar(50) NOT NULL,
	"model" varchar(100) NOT NULL,
	"input_tokens" integer NOT NULL,
	"output_tokens" integer NOT NULL,
	"total_tokens" integer NOT NULL,
	"duration_ms" integer NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "surplus_listings" ADD CONSTRAINT "surplus_listings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surplus_listings" ADD CONSTRAINT "surplus_listings_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "surplus_reservations" ADD CONSTRAINT "surplus_reservations_listing_id_surplus_listings_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."surplus_listings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "token_usage_log" ADD CONSTRAINT "token_usage_log_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "surplus_listings_user_status_idx" ON "surplus_listings" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "surplus_listings_product_idx" ON "surplus_listings" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "surplus_listings_expires_idx" ON "surplus_listings" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "surplus_reservations_listing_status_idx" ON "surplus_reservations" USING btree ("listing_id","status");--> statement-breakpoint
CREATE INDEX "surplus_reservations_confirmation_code_idx" ON "surplus_reservations" USING btree ("confirmation_code");--> statement-breakpoint
CREATE INDEX "surplus_reservations_expires_idx" ON "surplus_reservations" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "token_usage_log_user_created_idx" ON "token_usage_log" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "token_usage_log_call_site_created_idx" ON "token_usage_log" USING btree ("call_site","created_at");