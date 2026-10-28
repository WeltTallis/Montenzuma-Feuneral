package server


import  (
	"net/http"
	"github.com/gin-gonic/gin"
)



func   NewRouter()  *gin.Engine {

	r  :=   gin.Default();

	r.GET("/health"  , func( c  *gin.Contetx){

		c.JSON(http.StatusOk,  gin.H{
			"ok" :  true,
			"status": "Healthy"
		})
	})



	r.GET("/users"  ,  func(  c  ,   *gin.Contenxt){
		c.JSON(http.StatusOk,   gin.H{
			"Ok":  true,
			"users":   []string{"user1" ,   "user2"   ,   "user3"}
			"page":  1,

		})
	})
}