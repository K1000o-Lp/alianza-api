import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PersonaModule } from './persona/persona.module';
import { FormacionModule } from './formacion/formacion.module';
import { OrganizacionModule } from './organizacion/organizacion.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'admin',
      database: 'ALIANZA_NEIVA',
      entities: [__dirname + '/**/*.entity{.ts, .js}'],
      synchronize: true,
      autoLoadEntities: true,
    }),
    OrganizacionModule,
    PersonaModule,
    FormacionModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
