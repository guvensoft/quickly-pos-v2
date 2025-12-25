import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { MessageService } from '../../../providers/message.service';

@Component({
	standalone: true,
	imports: [CommonModule],
	selector: 'app-message',
	templateUrl: './message.component.html',
	styleUrls: ['./message.component.scss']
})

export class MessageComponent implements OnInit, OnDestroy {
	subscription!: Subscription;
	message!: any;
	show!: boolean;

	constructor(private messageService: MessageService) {
	}

	ngOnInit() {
		this.subscription = this.messageService.getMessage().subscribe((message) => {
			this.message = message;
		});
	}

	ngOnDestroy() {
		this.subscription.unsubscribe();
	}

}
