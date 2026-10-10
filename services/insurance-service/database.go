package main

import (
	"context"
	"github.com/jackc/pgx/v5/pgxpool"
)

func migrate(ctx context.Context,db *pgxpool.Pool)error{_,err:=db.Exec(ctx,`
