import { Component, OnInit, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageService } from '../../../core/services/message.service';

@Component({
	standalone: true,
	imports: [CommonModule],
	selector: 'app-message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.scss']
})

export class MessageComponent implements OnInit {
	private readonly messageService = inject(MessageService);

	readonly message = signal<any>(null);
	readonly show = signal<boolean>(false);

	ngOnInit() {
		// Set up reactive effect for message changes
		effect(() => {
			this.messageService.getMessage().subscribe((message) => {
				this.message.set(message);
			});
		}, { allowSignalWrites: true });
	}

}
