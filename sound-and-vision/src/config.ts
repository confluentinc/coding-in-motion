import { SchemaRegistryAPIClientArgs } from "@kafkajs/confluent-schema-registry/dist/api";
import { KafkaConfig } from "kafkajs";

export const KAFKA_CONFIG: KafkaConfig = {
    brokers: ['<Cluster Settings -> Bootstrap server>'],
    ssl: true,
    sasl: {
        mechanism: 'plain',
        username: '<Data Integration -> API Keys -> Key>',
        password: '<Data Integration -> API Keys -> Secret>'
    }
};


export const SCHEMA_REGISTRY_CONFIG: SchemaRegistryAPIClientArgs = {
    host: '<Schema Registry -> API Endpoint>',
    auth: {
        username: '<Schema Registry -> API Credentials Key>',
        password: '<Schema Registry -> API Credentials Secret>'
    }
};
