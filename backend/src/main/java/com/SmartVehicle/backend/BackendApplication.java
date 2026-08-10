package com.SmartVehicle.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;

import io.github.cdimascio.dotenv.Dotenv;

@EnableAsync
@SpringBootApplication
public class BackendApplication {

	public static void main(String[] args) {
		Dotenv dotenv = Dotenv.configure().directory("./").ignoreIfMissing().load();
		if (dotenv.entries().isEmpty()) {
			dotenv = Dotenv.configure().directory("../").ignoreIfMissing().load();
		}
		dotenv.entries().forEach(entry -> {
			System.setProperty(entry.getKey(), entry.getValue());
		});
		
		String mongoUri = System.getProperty("MONGODB_URI");
		if (mongoUri == null || mongoUri.isBlank()) {
			mongoUri = System.getProperty("SPRING_DATA_MONGODB_URI");
		}
		if (mongoUri != null && !mongoUri.isBlank()) {
			System.setProperty("spring.data.mongodb.uri", mongoUri);
			System.setProperty("spring.mongodb.uri", mongoUri);
			System.setProperty("MONGODB_URI", mongoUri);
			System.setProperty("SPRING_DATA_MONGODB_URI", mongoUri);
		}
		
		SpringApplication.run(BackendApplication.class, args);
	}
}
