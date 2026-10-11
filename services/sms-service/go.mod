module github.com/tech-kenya/restpoint/services/sms-service

replace github.com/tech-kenya/africastalkingsms => ./

retract (
	v1.0.6
	v1.0.5
	v1.0.4 // old package name
	v1.0.3
	v1.0.2
	v1.0.1
	v1.0.0
)

go 1.24.1

require github.com/tech-kenya/africastalkingsms v0.0.0-00010101000000-000000000000
