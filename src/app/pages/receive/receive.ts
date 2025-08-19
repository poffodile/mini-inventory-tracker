import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-receive',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receive.html',
  styleUrls: ['./receive.css'],
})
export class Receive {
  productId: string = '';
  quantity: number = 1;
  locationId: string = '';

  submitForm() {
    // Handles  form submission
    console.log('Form submitted and received :', {
      productId: this.productId,
      quantity: this.quantity,
      locationId: this.locationId,
    });
    alert('Form submitted and recieved successfully!');
  }
}
