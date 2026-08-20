package com.eventoingressos.backend.catalog;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

@Configuration
@EnableConfigurationProperties(TicketmasterProperties.class)
public class TicketmasterConfig {

    @Bean
    public RestClient ticketmasterRestClient(TicketmasterProperties properties) {
        return RestClient.builder().baseUrl(properties.baseUrl()).build();
    }
}
