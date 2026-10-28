package   notes

type   Note  struct {

	  ID    primitive.ObjectID   `bson:"_id" json: "id"`
	  title  string   `bson:"title" json:  "title"`
	  Content   string `bson:"content"  json "content"`

	  CreatedAt   time.Time  `bson: "CraetedAT"  json:"CraetedAt",


}



type   CreateNoteRequest   struct {


Title  string  `json:"Title"  binding:"required"`
Content  string  `json:"Content"  binding:  "required"

pinned  bool   'json:'



}