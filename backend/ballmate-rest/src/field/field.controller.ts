import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { FieldService } from './field.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { FieldType } from '@prisma/client';

@Controller('fields')
export class FieldController {
  constructor(private readonly fieldService: FieldService) { }

  @Post()
  create(@Body() createFieldDto: CreateFieldDto) {
    return this.fieldService.create(createFieldDto);
  }

  @Get('stats')
  getStats() {
    return this.fieldService.getStats();
  }

  @Get()
  findAll(
    @Query('city') city?: string,
    @Query('fieldType') fieldType?: FieldType,
    @Query('maxPrice') maxPrice?: string,
  ) {
    return this.fieldService.findAll({
      city,
      fieldType,
      maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fieldService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFieldDto: UpdateFieldDto,
  ) {
    return this.fieldService.update(id, updateFieldDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.fieldService.remove(id);
  }
}
