package notes

import "go.mongodb.org/mongo-driver/v2/mongo"

type Repo struct {
	coll *mongo.Collection
}



func   newRepo(db   *mongo.Datbase){

	return  &repo{
		coll  :  db.Collection("notes")
	}
}



